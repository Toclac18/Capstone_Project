package com.capstone.be.controller;

import com.capstone.be.dto.request.document.UploadDocumentInfoRequest;
import com.capstone.be.dto.response.document.DocumentDetailResponse;
import com.capstone.be.dto.response.document.DocumentPresignedUrlResponse;
import com.capstone.be.dto.response.document.DocumentUploadResponse;
import com.capstone.be.security.model.UserPrincipal;
import com.capstone.be.service.DocumentService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Controller for document management
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/documents")
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

}
