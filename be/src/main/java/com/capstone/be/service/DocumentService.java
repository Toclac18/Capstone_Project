package com.capstone.be.service;

import com.capstone.be.dto.request.document.DocumentLibraryFilter;
import com.capstone.be.dto.request.document.UploadDocumentInfoRequest;
import com.capstone.be.dto.response.document.DocumentDetailResponse;
import com.capstone.be.dto.response.document.DocumentLibraryResponse;
import com.capstone.be.dto.response.document.DocumentPresignedUrlResponse;
import com.capstone.be.dto.response.document.DocumentUploadHistoryResponse;
import com.capstone.be.dto.response.document.DocumentUploadResponse;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

  void redeemDocument(UUID readerId, UUID documentId);

  /**
   * Get presigned URL for accessing a document file Access control: Document must be PUBLIC, or
   * user is uploader, or user is in organization, or user has redeemed
   *
   * @param userId     User ID requesting access
   * @param documentId Document ID
   * @return Presigned URL response with expiration time
   */
  DocumentPresignedUrlResponse getDocumentPresignedUrl(UUID userId, UUID documentId);

  /**
   * Get detailed information about a document Includes comprehensive metadata, uploader info,
   * organization, tags, and user-specific data
   *
   * @param userId     User ID requesting the document detail (can be null for public access)
   * @param documentId Document ID
   * @return Document detail response with all metadata
   */
  DocumentDetailResponse getDocumentDetail(UUID userId, UUID documentId);

  /**
   * Get upload history for a user
   * Returns paginated list of all documents uploaded by the user
   *
   * @param uploaderId User ID who uploaded the documents
   * @param pageable Pagination parameters
   * @return Page of document upload history
   */
  Page<DocumentUploadHistoryResponse> getUploadHistory(UUID uploaderId, Pageable pageable);

  /**
   * Get user's document library with filtering and search Returns documents uploaded by user OR
   * purchased/redeemed by user
   *
   * @param userId   User ID
   * @param filter   Filter criteria (search, filters)
   * @param pageable Pagination parameters
   * @return Page of document library
   */
  Page<DocumentLibraryResponse> getLibrary(UUID userId, DocumentLibraryFilter filter,
      Pageable pageable);

}
