package com.capstone.be.service.impl;

import com.capstone.be.exception.InvalidRequestException;
import com.capstone.be.service.DocumentConversionService;
import com.capstone.be.service.SystemConfigService;
import jakarta.annotation.PostConstruct;
import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Implementation of DocumentConversionService using LibreOffice headless.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentConversionServiceImpl implements DocumentConversionService {

  private final SystemConfigService systemConfigService;

  @Value("${app.document.conversion.libreoffice-path:}")
  private String libreOfficePath;

  @Value("${app.document.conversion.timeout-seconds:60}")
  private int conversionTimeoutSecondsFallback;

  /**
   * Get conversion timeout seconds from SystemConfig, fallback to @Value
   */
  private int getConversionTimeoutSeconds() {
    return systemConfigService.getIntValue("document.conversion.timeoutSeconds", conversionTimeoutSecondsFallback);
  }

  private String detectedLibreOfficePath = null;

  @PostConstruct
  public void init() {
    detectLibreOffice();
  }

  private void detectLibreOffice() {
    // Check configured path first
    if (libreOfficePath != null && !libreOfficePath.isEmpty()) {
      if (isExecutable(libreOfficePath)) {
        detectedLibreOfficePath = libreOfficePath;
        log.info("Using configured LibreOffice path: {}", detectedLibreOfficePath);
        return;
      }
    }

    // Try common paths
    String[] commonPaths = {
      "/usr/bin/soffice",
      "/usr/bin/libreoffice",
      "/usr/local/bin/soffice",
      "/usr/local/bin/libreoffice",
      "/Applications/LibreOffice.app/Contents/MacOS/soffice",
      "C:\\Program Files\\LibreOffice\\program\\soffice.exe",
      "C:\\Program Files (x86)\\LibreOffice\\program\\soffice.exe"
    };

    for (String path : commonPaths) {
      if (isExecutable(path)) {
        detectedLibreOfficePath = path;
        log.info("Detected LibreOffice at: {}", detectedLibreOfficePath);
        return;
      }
    }

    // Try to find via 'which' command on Unix-like systems
    try {
      ProcessBuilder pb = new ProcessBuilder("which", "soffice");
      Process process = pb.start();
      if (process.waitFor(5, TimeUnit.SECONDS) && process.exitValue() == 0) {
        try (BufferedReader reader =
            new BufferedReader(new InputStreamReader(process.getInputStream()))) {
          String path = reader.readLine();
          if (path != null && !path.isEmpty() && isExecutable(path)) {
            detectedLibreOfficePath = path;
            log.info("Found LibreOffice via 'which': {}", detectedLibreOfficePath);
            return;
          }
        }
      }
    } catch (Exception e) {
      // Ignore - 'which' command not available
    }

    log.error("LibreOffice not found! DOCX to PDF conversion will not work.");
  }

  private boolean isExecutable(String path) {
    try {
      File file = new File(path);
      return file.exists() && file.canExecute();
    } catch (Exception e) {
      return false;
    }
  }

  @Override
  public InputStream convertDocxToPdf(MultipartFile docxFile) {
    if (docxFile == null || docxFile.isEmpty()) {
      throw new InvalidRequestException("DOCX file is required for conversion");
    }

    String filename = docxFile.getOriginalFilename();
    if (!isDocxFile(filename)) {
      throw new InvalidRequestException("File must be a DOCX file for conversion");
    }

    if (detectedLibreOfficePath == null) {
      throw new InvalidRequestException(
          "LibreOffice is not installed. Please install LibreOffice to convert DOCX files.");
    }

    log.info("Starting DOCX to PDF conversion for file: {}", filename);

    Path tempDir = null;
    Path inputFile = null;

    try {
      // Create temp directory
      tempDir = Files.createTempDirectory("docx-convert-");
      inputFile = tempDir.resolve(filename);

      // Write input file
      Files.write(inputFile, docxFile.getBytes());

      // Run LibreOffice conversion
      ProcessBuilder pb =
          new ProcessBuilder(
              detectedLibreOfficePath,
              "--headless",
              "--convert-to",
              "pdf",
              "--outdir",
              tempDir.toString(),
              inputFile.toString());
      pb.redirectErrorStream(true);

      Process process = pb.start();

      // Capture output for debugging
      StringBuilder output = new StringBuilder();
      try (BufferedReader reader =
          new BufferedReader(new InputStreamReader(process.getInputStream()))) {
        String line;
        while ((line = reader.readLine()) != null) {
          output.append(line).append("\n");
        }
      }

      int timeoutSeconds = getConversionTimeoutSeconds();
      boolean completed = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);

      if (!completed) {
        process.destroyForcibly();
        throw new InvalidRequestException(
            "DOCX to PDF conversion timed out after " + timeoutSeconds + " seconds");
      }

      if (process.exitValue() != 0) {
        log.error("LibreOffice conversion failed. Output: {}", output);
        throw new InvalidRequestException(
            "DOCX to PDF conversion failed. Please ensure the file is a valid DOCX document.");
      }

      // Find the output PDF file
      String pdfFilename = filename.substring(0, filename.lastIndexOf('.')) + ".pdf";
      Path pdfFile = tempDir.resolve(pdfFilename);

      if (!Files.exists(pdfFile)) {
        log.error(
            "PDF output file not found: {}. LibreOffice output: {}", pdfFile, output);
        throw new InvalidRequestException(
            "DOCX to PDF conversion failed - output file not created");
      }

      // Read PDF into memory
      byte[] pdfBytes = Files.readAllBytes(pdfFile);

      log.info(
          "Successfully converted DOCX to PDF: {} -> {} ({} bytes)",
          filename,
          pdfFilename,
          pdfBytes.length);

      return new ByteArrayInputStream(pdfBytes);

    } catch (InvalidRequestException e) {
      throw e;
    } catch (Exception e) {
      log.error("Failed to convert DOCX to PDF: {}", e.getMessage(), e);
      throw new InvalidRequestException("Failed to convert DOCX to PDF: " + e.getMessage());
    } finally {
      // Cleanup temp files
      cleanupTempFiles(tempDir);
    }
  }

  private void cleanupTempFiles(Path tempDir) {
    try {
      if (tempDir != null && Files.exists(tempDir)) {
        Files.walk(tempDir)
            .sorted((a, b) -> -a.compareTo(b)) // Delete files before directories
            .forEach(
                path -> {
                  try {
                    Files.deleteIfExists(path);
                  } catch (IOException e) {
                    log.warn("Failed to delete temp file: {}", path);
                  }
                });
      }
    } catch (Exception e) {
      log.warn("Failed to cleanup temp directory: {}", e.getMessage());
    }
  }

  @Override
  public boolean isDocxFile(String filename) {
    if (filename == null) {
      return false;
    }
    return filename.toLowerCase().endsWith(".docx");
  }

  @Override
  public boolean isPdfFile(String filename) {
    if (filename == null) {
      return false;
    }
    return filename.toLowerCase().endsWith(".pdf");
  }
}
