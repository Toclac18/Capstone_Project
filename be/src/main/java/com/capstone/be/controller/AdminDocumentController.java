package com.capstone.be.controller;

import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.DocVisibility;
import com.capstone.be.dto.common.ApiResponse;
import com.capstone.be.dto.common.PagedResponse;
import com.capstone.be.dto.request.admin.UpdateDocumentStatusRequest;
import com.capstone.be.dto.response.document.AdminDocumentListResponse;
import com.capstone.be.dto.response.document.DocumentDetailResponse;
import com.capstone.be.service.DocumentService;
import jakarta.validation.Valid;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/admin/documents")
@RequiredArgsConstructor
public class AdminDocumentController {

  private final DocumentService documentService;
  private final JdbcTemplate jdbcTemplate;

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
      @RequestParam(name = "dateFrom", required = false) 
      @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant dateFrom,
      @RequestParam(name = "dateTo", required = false) 
      @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant dateTo,
      @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
    log.info(
        "Admin requesting all documents - title: {}, uploaderId: {}, organizationId: {}, "
            + "docTypeId: {}, specializationId: {}, status: {}, visibility: {}, isPremium: {}, "
            + "dateFrom: {}, dateTo: {}, page: {}, size: {}",
        title, uploaderId, organizationId, docTypeId, specializationId, status, visibility,
        isPremium, dateFrom, dateTo, pageable.getPageNumber(), pageable.getPageSize());

    Page<AdminDocumentListResponse> page = documentService.getAllDocumentsForAdmin(
        title, uploaderId, organizationId, docTypeId, specializationId, status, visibility,
        isPremium, dateFrom, dateTo, pageable);

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

  @PatchMapping("/{documentId}/status")
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  public ResponseEntity<ApiResponse<Void>> updateDocumentStatus(
      @PathVariable(name = "documentId") UUID documentId,
      @Valid @RequestBody UpdateDocumentStatusRequest request) {
    log.info("Admin updating document {} status to {}", documentId, request.getStatus());

    documentService.updateDocumentStatus(documentId, request.getStatus());

    ApiResponse<Void> response = ApiResponse.<Void>builder()
        .success(true)
        .message("Document status updated successfully")
        .build();

    return ResponseEntity.ok(response);
  }
  
  @GetMapping("/statistics")
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  public ResponseEntity<ApiResponse<com.capstone.be.dto.response.document.DocumentStatisticsResponse>> getDocumentStatistics() {
    log.info("Admin requesting document statistics");
    
    com.capstone.be.dto.response.document.DocumentStatisticsResponse statistics = 
        documentService.getDocumentStatistics();
    
    ApiResponse<com.capstone.be.dto.response.document.DocumentStatisticsResponse> response = 
        ApiResponse.<com.capstone.be.dto.response.document.DocumentStatisticsResponse>builder()
            .success(true)
            .message("Document statistics retrieved successfully")
            .data(statistics)
            .build();
    
    return ResponseEntity.ok(response);
  }

  /**
   * Fix documents with old status 'VERIFIED' or 'AI_VERIFIED' to 'PENDING_REVIEW'
   * POST /api/admin/documents/fix-status
   * 
   * This is a one-time migration endpoint to fix data inconsistency
   */
  @PostMapping("/fix-status")
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  @Transactional
  public ResponseEntity<ApiResponse<String>> fixDocumentStatus() {
    log.info("Admin manually triggering document status fix");
    
    try {
      // Check if there are any documents with old status 'VERIFIED' or 'AI_VERIFIED'
      Integer count = jdbcTemplate.queryForObject(
          "SELECT COUNT(*) FROM document WHERE status IN ('VERIFIED', 'AI_VERIFIED')",
          Integer.class
      );

      if (count != null && count > 0) {
        log.warn("Found {} documents with old status 'VERIFIED' or 'AI_VERIFIED'. Fixing to 'PENDING_REVIEW'...", count);
        
        // Update all documents with old status to 'PENDING_REVIEW'
        int updated = jdbcTemplate.update(
            "UPDATE document SET status = 'PENDING_REVIEW' WHERE status IN ('VERIFIED', 'AI_VERIFIED')"
        );
        
        log.info("Successfully updated {} documents to 'PENDING_REVIEW'", updated);
        
        return ResponseEntity.ok(ApiResponse.<String>builder()
            .success(true)
            .message("Successfully updated " + updated + " documents to 'PENDING_REVIEW'")
            .data("Updated " + updated + " documents")
            .build());
      } else {
        log.info("No documents with old status found. Migration not needed.");
        return ResponseEntity.ok(ApiResponse.<String>builder()
            .success(true)
            .message("No documents with old status found. Migration not needed.")
            .data("No documents to update")
            .build());
      }
    } catch (Exception e) {
      log.error("Error fixing document status: {}", e.getMessage(), e);
      return ResponseEntity.ok(ApiResponse.<String>builder()
          .success(false)
          .message("Error fixing document status: " + e.getMessage())
          .data(null)
          .build());
    }
  }
}
