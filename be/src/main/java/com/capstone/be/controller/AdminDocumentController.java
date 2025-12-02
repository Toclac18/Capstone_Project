package com.capstone.be.controller;

import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.DocVisibility;
import com.capstone.be.dto.common.ApiResponse;
import com.capstone.be.dto.common.PagedResponse;
import com.capstone.be.dto.response.document.AdminDocumentListResponse;
import com.capstone.be.dto.response.document.DocumentDetailResponse;
import com.capstone.be.service.DocumentService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/admin/documents")
@RequiredArgsConstructor
public class AdminDocumentController {

  private final DocumentService documentService;

  @GetMapping
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  public ResponseEntity<PagedResponse<AdminDocumentListResponse>> getAllDocuments(
      @RequestParam(name = "title", required = false) String title,
      @RequestParam(name = "uploaderId", required = false) UUID uploaderId,
      @RequestParam(name = "organizationId", required = false) UUID organizationId,
      @RequestParam(name = "docTypeId", required = false) UUID docTypeId,
      @RequestParam(name = "specializationId", required = false) UUID specializationId,
      @RequestParam(name = "status", required = false) DocStatus status,
      @RequestParam(name = "visibility", required = false) DocVisibility visibility,
      @RequestParam(name = "isPremium", required = false) Boolean isPremium,
      Pageable pageable) {
    log.info(
        "Admin requesting all documents - title: {}, uploaderId: {}, organizationId: {}, "
            + "docTypeId: {}, specializationId: {}, status: {}, visibility: {}, isPremium: {}, "
            + "page: {}, size: {}",
        title, uploaderId, organizationId, docTypeId, specializationId, status, visibility,
        isPremium, pageable.getPageNumber(), pageable.getPageSize());

    Page<AdminDocumentListResponse> page = documentService.getAllDocumentsForAdmin(
        title, uploaderId, organizationId, docTypeId, specializationId, status, visibility,
        isPremium, pageable);

    PagedResponse<AdminDocumentListResponse> response = PagedResponse.of(page,
        "Documents retrieved successfully");

    return ResponseEntity.ok(response);
  }

  @GetMapping("/{documentId}")
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  public ResponseEntity<ApiResponse<DocumentDetailResponse>> getDocumentById(
      @PathVariable(name = "documentId") UUID documentId) {
    log.info("Admin requesting document by ID: {}", documentId);

    DocumentDetailResponse documentResponse = documentService.getDocumentDetailForAdmin(
        documentId);

    ApiResponse<DocumentDetailResponse> response = ApiResponse.<DocumentDetailResponse>builder()
        .success(true)
        .message("Document retrieved successfully")
        .data(documentResponse)
        .build();

    return ResponseEntity.ok(response);
  }

  @PatchMapping("/{documentId}/activate")
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  public ResponseEntity<ApiResponse<Void>> activateDocument(
      @PathVariable(name = "documentId") UUID documentId) {
    log.info("Admin activating document: {}", documentId);

    documentService.activateDocument(documentId);

    ApiResponse<Void> response = ApiResponse.<Void>builder()
        .success(true)
        .message("Document activated successfully")
        .build();

    return ResponseEntity.ok(response);
  }

  @PatchMapping("/{documentId}/deactivate")
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  public ResponseEntity<ApiResponse<Void>> deactivateDocument(
      @PathVariable(name = "documentId") UUID documentId) {
    log.info("Admin deactivating document: {}", documentId);

    documentService.deactivateDocument(documentId);

    ApiResponse<Void> response = ApiResponse.<Void>builder()
        .success(true)
        .message("Document deactivated successfully")
        .build();

    return ResponseEntity.ok(response);
  }
}
