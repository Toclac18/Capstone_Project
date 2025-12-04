package com.capstone.be.controller;

import com.capstone.be.dto.common.PagedResponse;
import com.capstone.be.dto.request.document.DocumentLibraryFilter;
import com.capstone.be.dto.request.document.DocumentSearchFilter;
import com.capstone.be.dto.request.document.DocumentUploadHistoryFilter;
import com.capstone.be.dto.request.document.UpdateDocumentRequest;
import com.capstone.be.dto.request.document.UploadDocumentInfoRequest;
import com.capstone.be.dto.request.document.VoteDocumentRequest;
import com.capstone.be.dto.response.document.DocumentDetailResponse;
import com.capstone.be.dto.response.document.DocumentLibraryResponse;
import com.capstone.be.dto.response.document.DocumentPresignedUrlResponse;
import com.capstone.be.dto.response.document.DocumentReadHistoryResponse;
import com.capstone.be.dto.response.document.DocumentSearchResponse;
import com.capstone.be.dto.response.document.DocumentUploadHistoryResponse;
import com.capstone.be.dto.response.document.DocumentUploadResponse;
import com.capstone.be.dto.response.document.VoteDocumentResponse;
import com.capstone.be.security.model.UserPrincipal;
import com.capstone.be.service.DocumentService;
import com.capstone.be.service.DocumentVoteService;
import com.capstone.be.util.PagingUtil;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
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
  private final DocumentVoteService documentVoteService;

  /**
   * Upload a document POST /api/v1/documents/upload
   *
   * @param userPrincipal Authenticated user (uploader)
   * @param info          Document informatÏion
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

  /**
   * Search public documents Returns paginated list of PUBLIC and VERIFIED documents No
   * authentication required - open to everyone
   *
   * @return Paged response of search results
   * @body filter Search filters (all optional)
   */
  @PostMapping(value = "/search")
  public ResponseEntity<PagedResponse<DocumentSearchResponse>> searchPublicDocuments(
      @Valid @RequestBody DocumentSearchFilter filter) {
    Pageable pageable = PageRequest.of(
        filter.getPage(),
        filter.getSize(),
        PagingUtil.parseSort(filter.getSorts())
    );
    log.info("Public search request with filter: {} (page: {}, size: {})",
        filter, pageable.getPageNumber(), pageable.getPageSize());

    Page<DocumentSearchResponse> searchResults = documentService.searchPublicDocuments(filter,
        pageable);

    return ResponseEntity.ok(PagedResponse.of(searchResults));
  }

  /**
   * Vote on a document POST /api/documents/vote If vote already exists, it will be updated If
   * voteValue is 0, the vote will be removed
   *
   * @param request       Vote request with documentId and voteValue (-1, 0, 1)
   * @param userPrincipal Authenticated user
   * @return Vote response with updated vote counts
   */
  @PostMapping("/{documentId}/votes")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<VoteDocumentResponse> voteDocument(
      @PathVariable(name = "documentId") UUID documentId,
      @Valid @RequestBody VoteDocumentRequest request,
      @AuthenticationPrincipal UserPrincipal userPrincipal) {

    UUID userId = userPrincipal.getId();
    log.info("User {} voting on document {} with value {}", userId, documentId,
        request.getVoteValue());

    VoteDocumentResponse response = documentVoteService.voteDocument(userId, documentId, request);

    return ResponseEntity.ok(response);
  }

  /**
   * Get user's current vote for a document GET /api/documents/{documentId}/vote
   *
   * @param documentId    Document ID
   * @param userPrincipal Authenticated user
   * @return Vote response with user's vote and document vote stats
   */
  @GetMapping("/{documentId}/votes")
  @PreAuthorize("isAuthenticated()")
  public ResponseEntity<VoteDocumentResponse> getUserVote(
      @PathVariable(name = "documentId") UUID documentId,
      @AuthenticationPrincipal UserPrincipal userPrincipal) {

    UUID userId = userPrincipal.getId();
    log.info("User {} fetching vote for document {}", userId, documentId);

    VoteDocumentResponse response = documentVoteService.getUserVote(documentId, userId);

    return ResponseEntity.ok(response);
  }

  /**
   * API Homepage: Dành cho cả Guest và User
   */
  @GetMapping("/homepage")
  public ResponseEntity<Page<DocumentDetailResponse>> getHomepageDocuments(
          @AuthenticationPrincipal UserPrincipal userPrincipal,
          @RequestParam(name = "page", defaultValue = "0") int page,
          @RequestParam(name = "size", defaultValue = "20") int size
  ) {
    // Nếu chưa đăng nhập -> userId = null
    UUID userId = userPrincipal != null ? userPrincipal.getId() : null;

    log.info("Homepage request: page={}, size={}, userId={}", page, size, userId);

    Page<DocumentDetailResponse> response =
            documentService.getHomepageDocuments(userId, page, size);

    return ResponseEntity.ok(response);
  }

}
