package com.capstone.be.controller;

import com.capstone.be.dto.common.ApiResponse;
import com.capstone.be.dto.common.PagedResponse;
import com.capstone.be.dto.request.specialization.CreateSpecializationRequest;
import com.capstone.be.dto.request.specialization.UpdateSpecializationRequest;
import com.capstone.be.dto.response.specialization.SpecializationDetailResponse;
import com.capstone.be.service.SpecializationService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for Business Admin to manage specializations
 * Only accessible by users with BUSINESS_ADMIN role
 */
@Slf4j
@RestController
@RequestMapping("/admin/specializations")
@RequiredArgsConstructor
public class AdminSpecializationController {

  private final SpecializationService specializationService;

  /**
   * Get all specializations with optional filters (paginated)
   * GET /api/v1/admin/specializations
   */
  @GetMapping
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  public ResponseEntity<PagedResponse<SpecializationDetailResponse>> getAllSpecializations(
      @RequestParam(name = "domainId", required = false) UUID domainId,
      @RequestParam(name = "name", required = false) String name,
      Pageable pageable) {
    log.info("Admin requesting all specializations - domainId: {}, name: {}, page: {}, size: {}",
        domainId, name, pageable.getPageNumber(), pageable.getPageSize());

    Page<SpecializationDetailResponse> page = specializationService.getAllSpecializations(domainId,
        name, pageable);

    PagedResponse<SpecializationDetailResponse> response = PagedResponse.of(page,
        "Specializations retrieved successfully");

    return ResponseEntity.ok(response);
  }

  /**
   * Get specialization by ID
   * GET /api/v1/admin/specializations/{specializationId}
   */
  @GetMapping("/{specializationId}")
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  public ResponseEntity<ApiResponse<SpecializationDetailResponse>> getSpecializationById(
      @PathVariable(name = "specializationId") UUID specializationId) {
    log.info("Admin requesting specialization by ID: {}", specializationId);

    SpecializationDetailResponse specializationResponse = specializationService.getSpecializationById(
        specializationId);

    ApiResponse<SpecializationDetailResponse> response = ApiResponse.<SpecializationDetailResponse>builder()
        .success(true)
        .message("Specialization retrieved successfully")
        .data(specializationResponse)
        .build();

    return ResponseEntity.ok(response);
  }

  /**
   * Create a new specialization
   * POST /api/v1/admin/specializations
   */
  @PostMapping
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  public ResponseEntity<ApiResponse<SpecializationDetailResponse>> createSpecialization(
      @Valid @RequestBody CreateSpecializationRequest request) {
    log.info("Admin creating new specialization: {}", request.getName());

    SpecializationDetailResponse specializationResponse = specializationService.createSpecialization(
        request);

    ApiResponse<SpecializationDetailResponse> response = ApiResponse.<SpecializationDetailResponse>builder()
        .success(true)
        .message("Specialization created successfully")
        .data(specializationResponse)
        .build();

    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  /**
   * Update an existing specialization
   * PUT /api/v1/admin/specializations/{specializationId}
   */
  @PutMapping("/{specializationId}")
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  public ResponseEntity<ApiResponse<SpecializationDetailResponse>> updateSpecialization(
      @PathVariable(name = "specializationId") UUID specializationId,
      @Valid @RequestBody UpdateSpecializationRequest request) {
    log.info("Admin updating specialization: {}", specializationId);

    SpecializationDetailResponse specializationResponse = specializationService.updateSpecialization(
        specializationId, request);

    ApiResponse<SpecializationDetailResponse> response = ApiResponse.<SpecializationDetailResponse>builder()
        .success(true)
        .message("Specialization updated successfully")
        .data(specializationResponse)
        .build();

    return ResponseEntity.ok(response);
  }

//  /**
//   * Delete a specialization
//   * DELETE /api/v1/admin/specializations/{specializationId}
//   */
//  @DeleteMapping("/{specializationId}")
//  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
//  public ResponseEntity<ApiResponse<Void>> deleteSpecialization(
//      @PathVariable(name = "specializationId") UUID specializationId) {
//    log.info("Admin deleting specialization: {}", specializationId);
//
//    specializationService.deleteSpecialization(specializationId);
//
//    ApiResponse<Void> response = ApiResponse.<Void>builder()
//        .success(true)
//        .message("Specialization deleted successfully")
//        .build();
//
//    return ResponseEntity.ok(response);
//  }
}
