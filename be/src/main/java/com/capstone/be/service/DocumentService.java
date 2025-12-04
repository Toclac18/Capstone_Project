package com.capstone.be.service;

import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.DocVisibility;
import com.capstone.be.dto.request.document.DocumentLibraryFilter;
import com.capstone.be.dto.request.document.DocumentSearchFilter;
import com.capstone.be.dto.request.document.DocumentUploadHistoryFilter;
import com.capstone.be.dto.request.document.UpdateDocumentRequest;
import com.capstone.be.dto.request.document.UploadDocumentInfoRequest;
import com.capstone.be.dto.response.document.AdminDocumentListResponse;
import com.capstone.be.dto.response.document.DocumentDetailResponse;
import com.capstone.be.dto.response.document.DocumentLibraryResponse;
import com.capstone.be.dto.response.document.DocumentPresignedUrlResponse;
import com.capstone.be.dto.response.document.DocumentReadHistoryResponse;
import com.capstone.be.dto.response.document.DocumentSearchResponse;
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
   * Get upload history for a user with filtering and search
   * Returns paginated list of all documents uploaded by the user
   *
   * @param uploaderId User ID who uploaded the documents
   * @param filter Filter criteria (search, filters)
   * @param pageable Pagination parameters
   * @return Page of document upload history
   */
  Page<DocumentUploadHistoryResponse> getUploadHistory(UUID uploaderId,
      DocumentUploadHistoryFilter filter, Pageable pageable);

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

  /**
   * Update document metadata Only the uploader can update their own document
   *
   * @param uploaderId User ID of the uploader (for authorization)
   * @param documentId Document ID to update
   * @param request    Update request with new metadata
   * @return Updated document response
   */
  DocumentUploadResponse updateDocument(UUID uploaderId, UUID documentId,
      UpdateDocumentRequest request);

  /**
   * Delete a document Only the uploader can delete their own document
   *
   * @param uploaderId User ID of the uploader (for authorization)
   * @param documentId Document ID to delete
   */
  void deleteDocument(UUID uploaderId, UUID documentId);

  /**
   * Get read history for a user
   * Returns paginated list of documents the user has accessed
   *
   * @param userId User ID
   * @param pageable Pagination parameters
   * @return Page of read history
   */
  Page<DocumentReadHistoryResponse> getReadHistory(UUID userId, Pageable pageable);

  /**
   * Search public documents with filters Only returns PUBLIC and VERIFIED documents
   *
   * @param filter   Search criteria (all optional)
   * @param pageable Pagination parameters
   * @return Page of search results
   */
  Page<DocumentSearchResponse> searchPublicDocuments(DocumentSearchFilter filter,
      Pageable pageable);

  // ===== Admin-only methods =====

  /**
   * Get all documents for admin with filters
   * Admin can view all documents regardless of status
   *
   * @param title            Document title filter (partial match, case-insensitive)
   * @param uploaderId       Filter by uploader ID
   * @param organizationId   Filter by organization ID
   * @param docTypeId        Filter by document type ID
   * @param specializationId Filter by specialization ID
   * @param status           Filter by document status
   * @param visibility       Filter by visibility
   * @param isPremium        Filter by premium status
   * @param pageable         Pagination parameters
   * @return Page of documents
   */
  Page<AdminDocumentListResponse> getAllDocumentsForAdmin(
      String title,
      UUID uploaderId,
      UUID organizationId,
      UUID docTypeId,
      UUID specializationId,
      DocStatus status,
      DocVisibility visibility,
      Boolean isPremium,
      Pageable pageable);

  /**
   * Get document detail by ID for admin
   * Admin can view any document regardless of status or visibility
   *
   * @param documentId Document ID
   * @return Document detail response
   */
  DocumentDetailResponse getDocumentDetailForAdmin(UUID documentId);

  /**
   * Activate a document (set status to ACTIVE)
   * Only admin can activate documents
   *
   * @param documentId Document ID to activate
   */
  void activateDocument(UUID documentId);

  /**
   * Deactivate a document (set status to INACTIVE)
   * Only admin can deactivate documents
   *
   * @param documentId Document ID to deactivate
   */
  void deactivateDocument(UUID documentId);

  Page<DocumentDetailResponse> getHomepageDocuments(UUID userId, int page, int size);
}
