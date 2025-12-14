package com.capstone.be.controller;

import com.capstone.be.dto.common.ApiResponse;
import com.capstone.be.dto.common.PagedResponse;
import com.capstone.be.dto.request.domain.CreateDomainRequest;
import com.capstone.be.dto.request.domain.UpdateDomainRequest;
import com.capstone.be.dto.response.domain.DomainDetailResponse;
import com.capstone.be.service.DomainService;
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
 * Controller for Business Admin to manage domains Only accessible by users with BUSINESS_ADMIN
 * role
 */
@Slf4j
@RestController
@RequestMapping("/admin/domains")
@RequiredArgsConstructor
public class AdminDomainController {

  private final DomainService domainService;

  /**
   * Get all domains with optional filters (paginated) GET /api/v1/admin/domains
   */
  @GetMapping
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  public ResponseEntity<PagedResponse<DomainDetailResponse>> getAllDomains(
      @RequestParam(name = "name", required = false) String name,
      @RequestParam(name = "dateFrom", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.Instant dateFrom,
      @RequestParam(name = "dateTo", required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE_TIME) java.time.Instant dateTo,
      Pageable pageable) {
    log.info("Admin requesting all domains - name: {}, dateFrom: {}, dateTo: {}, page: {}, size: {}",
        name, dateFrom, dateTo, pageable.getPageNumber(), pageable.getPageSize());
    
    Page<DomainDetailResponse> page = domainService.getAllDomainsForAdmin(name, dateFrom, dateTo, pageable);

    PagedResponse<DomainDetailResponse> response = PagedResponse.of(page,
        "Domains retrieved successfully");

    return ResponseEntity.ok(response);
  }

  /**
   * Get domain by ID GET /api/v1/admin/domains/{domainId}
   */
  @GetMapping("/{domainId}")
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  public ResponseEntity<ApiResponse<DomainDetailResponse>> getDomainById(
      @PathVariable(name = "domainId") UUID domainId) {
    log.info("Admin requesting domain by ID: {}", domainId);

    DomainDetailResponse domainResponse = domainService.getDomainById(domainId);

    ApiResponse<DomainDetailResponse> response = ApiResponse.<DomainDetailResponse>builder()
        .success(true)
        .message("Domain retrieved successfully")
        .data(domainResponse)
        .build();

    return ResponseEntity.ok(response);
  }

  /**
   * Create a new domain POST /api/v1/admin/domains
   */
  @PostMapping
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  public ResponseEntity<ApiResponse<DomainDetailResponse>> createDomain(
      @Valid @RequestBody CreateDomainRequest request) {
    log.info("Admin creating new domain: {}", request.getName());

    DomainDetailResponse domainResponse = domainService.createDomain(request);

    ApiResponse<DomainDetailResponse> response = ApiResponse.<DomainDetailResponse>builder()
        .success(true)
        .message("Domain created successfully")
        .data(domainResponse)
        .build();

    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  /**
   * Update an existing domain PUT /api/v1/admin/domains/{domainId}
   */
  @PutMapping("/{domainId}")
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  public ResponseEntity<ApiResponse<DomainDetailResponse>> updateDomain(
      @PathVariable(name = "domainId") UUID domainId,
      @Valid @RequestBody UpdateDomainRequest request) {
    log.info("Admin updating domain: {}", domainId);

    DomainDetailResponse domainResponse = domainService.updateDomain(domainId, request);

    ApiResponse<DomainDetailResponse> response = ApiResponse.<DomainDetailResponse>builder()
        .success(true)
        .message("Domain updated successfully")
        .data(domainResponse)
        .build();

    return ResponseEntity.ok(response);
  }

//  /**
//   * Delete a domain
//   * DELETE /api/v1/admin/domains/{domainId}
//   */
//  @DeleteMapping("/{domainId}")
//  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
//  public ResponseEntity<ApiResponse<Void>> deleteDomain(
//      @PathVariable(name = "domainId") UUID domainId) {
//    log.info("Admin deleting domain: {}", domainId);
//
//    domainService.deleteDomain(domainId);
//
//    ApiResponse<Void> response = ApiResponse.<Void>builder()
//        .success(true)
//        .message("Domain deleted successfully")
//        .build();
//
//    return ResponseEntity.ok(response);
//  }
}
