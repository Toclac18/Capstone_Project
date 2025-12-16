package com.capstone.be.service;

import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;

/**
 * Service for converting documents between formats
 */
public interface DocumentConversionService {

  /**
   * Convert a DOCX file to PDF
   * 
   * @param docxFile The DOCX file to convert
   * @return InputStream of the converted PDF
   */
  InputStream convertDocxToPdf(MultipartFile docxFile);

  /**
   * Check if a file is a DOCX file
   * 
   * @param filename The filename to check
   * @return true if the file is a DOCX file
   */
  boolean isDocxFile(String filename);

  /**
   * Check if a file is a PDF file
   * 
   * @param filename The filename to check
   * @return true if the file is a PDF file
   */
  boolean isPdfFile(String filename);
}
