package com.capstone.be.service;

import com.capstone.be.dto.request.document.UploadDocumentInfoRequest;
import com.capstone.be.dto.response.document.DocumentUploadResponse;
import java.util.UUID;
import org.springframework.web.multipart.MultipartFile;

/**
 * Service interface for document management
 */
public interface DocumentService {

  /**
   * Upload a document with file to S3
   *
   * @param uploaderId Uploader user ID
   * @param request    Upload document request
   * @param file       PDF file to upload
   * @return Document upload response
   */
  DocumentUploadResponse uploadDocument(
      UUID uploaderId,
      UploadDocumentInfoRequest request,
      MultipartFile file
  );
}
