package com.capstone.be.service.impl;

import com.capstone.be.service.DocumentThumbnailService;
import com.capstone.be.service.FileStorageService;
import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.Image;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.UUID;
import javax.imageio.ImageIO;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentThumbnailServiceImpl implements DocumentThumbnailService {

  private final FileStorageService fileStorageService;

  private static final float DPI = 150f;      // Medium image quality
  private static final int MAX_WIDTH = 800;   // resize image

  @Override
  public String generateAndUploadThumbnail(MultipartFile file, String folder) {
    if (file == null || file.isEmpty()) {
      log.warn("Skip thumbnail generation: file is null or empty");
      return null;
    }

    if (!"application/pdf" .equalsIgnoreCase(file.getContentType())) {
      log.warn("Skip thumbnail generation: content type is not PDF, contentType={}",
          file.getContentType());
      return null;
    }

    try (PDDocument document = PDDocument.load(file.getInputStream())) {
      if (document.getNumberOfPages() == 0) {
        log.warn("PDF has no pages, skip thumbnail generation");
        return null;
      }

      PDFRenderer renderer = new PDFRenderer(document);
      // render first page
      BufferedImage pageImage = renderer.renderImageWithDPI(0, DPI);

      BufferedImage thumbnail = resizeImage(pageImage, MAX_WIDTH);

      ByteArrayOutputStream baos = new ByteArrayOutputStream();
      ImageIO.write(thumbnail, "png", baos);
      baos.flush();
      byte[] bytes = baos.toByteArray();

      String filename = "thumb-" + UUID.randomUUID() + ".png";

      String thumbnailUrl = fileStorageService.uploadFile(
          bytes,
          "image/png",
          folder,
          filename
      );

      log.info("Generated and uploaded thumbnail: {}", thumbnailUrl);
      return thumbnailUrl;

    } catch (IOException e) {
      log.error("Failed to generate thumbnail for document: {}", file.getOriginalFilename(), e);
      // don't throw -> not lead to Upload Document fail
      return null;
    }
  }

  private BufferedImage resizeImage(BufferedImage src, int maxWidth) {
    if (src.getWidth() <= maxWidth) {
      return src;
    }

    int newHeight = (int) ((double) src.getHeight() / src.getWidth() * maxWidth);

    Image scaled = src.getScaledInstance(maxWidth, newHeight, Image.SCALE_SMOOTH);
    BufferedImage resized = new BufferedImage(maxWidth, newHeight, BufferedImage.TYPE_INT_RGB);

    Graphics2D g2d = resized.createGraphics();
    g2d.setColor(Color.WHITE); // white background
    g2d.fillRect(0, 0, maxWidth, newHeight);
    g2d.drawImage(scaled, 0, 0, null);
    g2d.dispose();

    return resized;
  }
}
