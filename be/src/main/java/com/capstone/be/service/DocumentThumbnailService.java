package com.capstone.be.service;

import org.springframework.web.multipart.MultipartFile;

/**
 * Service to create thumbnail for Document (capture first page)
 */
public interface DocumentThumbnailService {

  /**
   * Generate thumbnail from PDF, upload to S3 and return URL
   *
   * @param file   PDF file
   * @param folder S3 folder for thumbnail, eg: "documents/thumbnails"
   * @return URL of thumbnail, or null if fail
   */
  String generateAndUploadThumbnail(MultipartFile file, String folder);
}

