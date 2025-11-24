package com.capstone.be.controller;

import com.capstone.be.dto.common.PagedResponse;
import com.capstone.be.dto.request.document.DocumentLibraryFilter;
import com.capstone.be.dto.request.document.DocumentUploadHistoryFilter;
import com.capstone.be.dto.request.document.UpdateDocumentRequest;
import com.capstone.be.dto.request.document.UploadDocumentInfoRequest;
import com.capstone.be.dto.response.document.DocumentDetailResponse;
import com.capstone.be.dto.response.document.DocumentLibraryResponse;
import com.capstone.be.dto.response.document.DocumentPresignedUrlResponse;
import com.capstone.be.dto.response.document.DocumentReadHistoryResponse;
import com.capstone.be.dto.response.document.DocumentUploadHistoryResponse;
import com.capstone.be.dto.response.document.DocumentUploadResponse;
import com.capstone.be.security.model.UserPrincipal;
import com.capstone.be.service.DocumentService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Controller for document management
 */
@Slf4j
@RestController
@RequestMapping("/documents")
@RequiredArgsConstructor
public class DocumentController {

  private final DocumentService documentService;

  /**
   * Upload a document POST /api/v1/documents/upload
   *
   * @param userPrincipal Authenticated user (uploader)
   * @param info          Document information
   * @param file          PDF file to upload
   * @return Document upload response
   */
  @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @PreAuthorize("hasAnyRole('READER', 'ORGANIZATION_ADMIN')")
  public ResponseEntity<DocumentUploadResponse> uploadDocument(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @Valid @RequestPart(name = "info") UploadDocumentInfoRequest info,
      @RequestPart(name = "file") MultipartFile file) {
    UUID uploaderId = userPrincipal.getId();
    log.info("User {} uploading document: {}", uploaderId, info.getTitle());

    DocumentUploadResponse response = documentService.uploadDocument(
        uploaderId, info, file);

    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  /**
   * Reader Redeem a Document (buy*)
   *
   * @param userPrincipal Authenticated user (redeemer)
   * @param documentId    document to redeem //   * @return Document upload response
   */
  @PostMapping(value = "/{id}/redeem")
  @PreAuthorize("hasRole('READER')")
  public ResponseEntity<Void> redeemDocument(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @PathVariable(name = "id") UUID documentId) {
    UUID userId = userPrincipal.getId();
    log.info("User {} redeeming document: {}", userId, documentId);

    documentService.redeemDocument(userId, documentId);

    return ResponseEntity.noContent().build();
  }

  /**
   * Get presigned URL for document access Access is granted if: - Document is PUBLIC, OR - User is
   * the uploader, OR - User is a member of the document's organization (for INTERNAL documents), OR
   * - User has redeemed/purchased the document
   *
   * @param userPrincipal Authenticated user
   * @param documentId    Document ID
   * @return Presigned URL response with expiration time
   */
  @GetMapping(value = "/{id}/presigned-url")
  @PreAuthorize("hasAnyRole('READER', 'ORGANIZATION_ADMIN')")
  public ResponseEntity<DocumentPresignedUrlResponse> getDocumentPresignedUrl(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @PathVariable(name = "id") UUID documentId) {
    UUID userId = userPrincipal.getId();
    log.info("User {} requesting presigned URL for document: {}", userId, documentId);

    DocumentPresignedUrlResponse response = documentService.getDocumentPresignedUrl(userId,
        documentId);

    return ResponseEntity.ok(response);
  }

  /**
   * Get detailed information about a document Includes comprehensive metadata, uploader info,
   * organization, specialization, tags, and user-specific data
   *
   * @param userPrincipal Authenticated user (optional - can be null for public documents)
   * @param documentId    Document ID
   * @return Document detail response with all metadata
   */
  @GetMapping(value = "/{id}")
  @PreAuthorize("hasAnyRole('READER', 'ORGANIZATION_ADMIN')")
  public ResponseEntity<DocumentDetailResponse> getDocumentDetail(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @PathVariable(name = "id") UUID documentId) {
    UUID userId = userPrincipal != null ? userPrincipal.getId() : null;
    log.info("User {} requesting document detail for document: {}", userId, documentId);

    DocumentDetailResponse response = documentService.getDocumentDetail(userId, documentId);

    return ResponseEntity.ok(response);
  }

  /**
   * Get upload history for the authenticated user with filtering and search
   * Returns paginated list of all documents uploaded by the user
   * Supports filtering by search keyword and premium status
   *
   * @param userPrincipal Authenticated user
   * @param filter Filter criteria (all optional)
   * @param pageable Pagination parameters (page, size, sort)
   * @return Paged response of document upload history
   */
  @GetMapping(value = "/my-uploads")
  @PreAuthorize("hasAnyRole('READER', 'ORGANIZATION_ADMIN')")
  public ResponseEntity<PagedResponse<DocumentUploadHistoryResponse>> getMyUploadHistory(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @ModelAttribute DocumentUploadHistoryFilter filter,
      Pageable pageable) {
    UUID uploaderId = userPrincipal.getId();
    log.info("User {} requesting upload history (page: {}, size: {}, filter: {})",
        uploaderId, pageable.getPageNumber(), pageable.getPageSize(), filter);

    Page<DocumentUploadHistoryResponse> historyPage = documentService.getUploadHistory(uploaderId,
        filter, pageable);

    return ResponseEntity.ok(PagedResponse.of(historyPage));
  }

  /**
   * Get user's document library with filtering and search Returns documents uploaded by user OR
   * purchased/redeemed by user Supports various filters and search by keyword
   *
   * @param userPrincipal Authenticated user
   * @param filter        Filter criteria (all optional)
   * @param pageable      Pagination parameters (page, size, sort)
   * @return Paged response of library documents
   */
  @GetMapping(value = "/library")
  @PreAuthorize("hasAnyRole('READER', 'ORGANIZATION_ADMIN')")
  public ResponseEntity<PagedResponse<DocumentLibraryResponse>> getLibrary(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @ModelAttribute DocumentLibraryFilter filter,
      Pageable pageable) {
    UUID userId = userPrincipal.getId();
    log.info("User {} requesting library (page: {}, size: {}, filter: {})",
        userId, pageable.getPageNumber(), pageable.getPageSize(), filter);

    Page<DocumentLibraryResponse> libraryPage = documentService.getLibrary(userId, filter,
        pageable);

    return ResponseEntity.ok(PagedResponse.of(libraryPage));
  }

  /**
   * Update document metadata Only the uploader can update their own document Does not update the
   * document file itself, only metadata
   *
   * @param userPrincipal Authenticated user (must be the uploader)
   * @param documentId    Document ID to update
   * @param request       Update request with new metadata
   * @return Updated document response
   */
  @PutMapping(value = "/{id}")
  @PreAuthorize("hasAnyRole('READER', 'ORGANIZATION_ADMIN')")
  public ResponseEntity<DocumentUploadResponse> updateDocument(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @PathVariable(name = "id") UUID documentId,
      @Valid @RequestBody UpdateDocumentRequest request) {
    UUID uploaderId = userPrincipal.getId();
    log.info("User {} updating document {}", uploaderId, documentId);

    DocumentUploadResponse response = documentService.updateDocument(uploaderId, documentId,
        request);

    return ResponseEntity.ok(response);
  }

  /**
   * Delete a document Only the uploader can delete their own document Also deletes the document
   * file from S3
   *
   * @param userPrincipal Authenticated user (must be the uploader)
   * @param documentId    Document ID to delete
   * @return No content response
   */
  @DeleteMapping(value = "/{id}")
  @PreAuthorize("hasAnyRole('READER', 'ORGANIZATION_ADMIN')")
  public ResponseEntity<Void> deleteDocument(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @PathVariable(name = "id") UUID documentId) {
    UUID uploaderId = userPrincipal.getId();
    log.info("User {} deleting document {}", uploaderId, documentId);

    documentService.deleteDocument(uploaderId, documentId);

    return ResponseEntity.noContent().build();
  }

  /**
   * Get read history for the authenticated user
   * Returns paginated list of documents the user has accessed
   *
   * @param userPrincipal Authenticated user
   * @param pageable Pagination parameters (page, size, sort)
   * @return Paged response of read history
   */
  @GetMapping(value = "/read-history")
  @PreAuthorize("hasAnyRole('READER', 'ORGANIZATION_ADMIN')")
  public ResponseEntity<PagedResponse<DocumentReadHistoryResponse>> getReadHistory(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      Pageable pageable) {
    UUID userId = userPrincipal.getId();
    log.info("User {} requesting read history (page: {}, size: {})",
        userId, pageable.getPageNumber(), pageable.getPageSize());

    Page<DocumentReadHistoryResponse> historyPage = documentService.getReadHistory(userId,
        pageable);

    return ResponseEntity.ok(PagedResponse.of(historyPage));
  }

}
