package com.capstone.be.controller;

import com.capstone.be.dto.common.ApiResponse;
import com.capstone.be.dto.common.PagedResponse;
import com.capstone.be.dto.request.doctype.CreateDocTypeRequest;
import com.capstone.be.dto.request.doctype.UpdateDocTypeRequest;
import com.capstone.be.dto.response.doctype.DocTypeDetailResponse;
import com.capstone.be.service.DocTypeService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for Business Admin to manage document types
 * Only accessible by users with BUSINESS_ADMIN role
 */
@Slf4j
@RestController
@RequestMapping("/admin/doc-types")
@RequiredArgsConstructor
public class AdminDocTypeController {

  private final DocTypeService docTypeService;

  /**
   * Get all document types with optional filters (paginated)
   * GET /api/v1/admin/doc-types
   */
  @GetMapping
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  public ResponseEntity<PagedResponse<DocTypeDetailResponse>> getAllDocTypes(
      @RequestParam(name = "name", required = false) String name,
      @RequestParam(name = "dateFrom", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.Instant dateFrom,
      @RequestParam(name = "dateTo", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.Instant dateTo,
      Pageable pageable) {
    log.info("Admin requesting all document types - name: {}, dateFrom: {}, dateTo: {}, page: {}, size: {}",
        name, dateFrom, dateTo, pageable.getPageNumber(), pageable.getPageSize());
    
    Page<DocTypeDetailResponse> page = docTypeService.getAllDocTypesForAdmin(name, dateFrom, dateTo, pageable);

    PagedResponse<DocTypeDetailResponse> response = PagedResponse.of(page,
        "Document types retrieved successfully");

    return ResponseEntity.ok(response);
  }

  /**
   * Get document type by ID
   * GET /api/v1/admin/doc-types/{docTypeId}
   */
  @GetMapping("/{docTypeId}")
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  public ResponseEntity<ApiResponse<DocTypeDetailResponse>> getDocTypeById(
      @PathVariable(name = "docTypeId") UUID docTypeId) {
    log.info("Admin requesting document type by ID: {}", docTypeId);

    DocTypeDetailResponse docTypeResponse = docTypeService.getDocTypeById(docTypeId);

    ApiResponse<DocTypeDetailResponse> response = ApiResponse.<DocTypeDetailResponse>builder()
        .success(true)
        .message("Document type retrieved successfully")
        .data(docTypeResponse)
        .build();

    return ResponseEntity.ok(response);
  }

  /**
   * Create a new document type
   * POST /api/v1/admin/doc-types
   */
  @PostMapping
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  public ResponseEntity<ApiResponse<DocTypeDetailResponse>> createDocType(
      @Valid @RequestBody CreateDocTypeRequest request) {
    log.info("Admin creating new document type: {}", request.getName());

    DocTypeDetailResponse docTypeResponse = docTypeService.createDocType(request);

    ApiResponse<DocTypeDetailResponse> response = ApiResponse.<DocTypeDetailResponse>builder()
        .success(true)
        .message("Document type created successfully")
        .data(docTypeResponse)
        .build();

    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  /**
   * Update an existing document type
   * PUT /api/v1/admin/doc-types/{docTypeId}
   */
  @PutMapping("/{docTypeId}")
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  public ResponseEntity<ApiResponse<DocTypeDetailResponse>> updateDocType(
      @PathVariable(name = "docTypeId") UUID docTypeId,
      @Valid @RequestBody UpdateDocTypeRequest request) {
    log.info("Admin updating document type: {}", docTypeId);

    DocTypeDetailResponse docTypeResponse = docTypeService.updateDocType(docTypeId, request);

    ApiResponse<DocTypeDetailResponse> response = ApiResponse.<DocTypeDetailResponse>builder()
        .success(true)
        .message("Document type updated successfully")
        .data(docTypeResponse)
        .build();

    return ResponseEntity.ok(response);
  }

//  /**
//   * Delete a document type
//   * DELETE /api/v1/admin/doc-types/{docTypeId}
//   */
//  @DeleteMapping("/{docTypeId}")
//  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
//  public ResponseEntity<ApiResponse<Void>> deleteDocType(
//      @PathVariable(name = "docTypeId") UUID docTypeId) {
//    log.info("Admin deleting document type: {}", docTypeId);
//
//    docTypeService.deleteDocType(docTypeId);
//
//    ApiResponse<Void> response = ApiResponse.<Void>builder()
//        .success(true)
//        .message("Document type deleted successfully")
//        .build();
//
//    return ResponseEntity.ok(response);
//  }
}
