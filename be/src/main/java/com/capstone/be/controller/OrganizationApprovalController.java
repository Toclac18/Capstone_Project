package com.capstone.be.controller;

import com.capstone.be.dto.common.PageInfo;
import com.capstone.be.dto.common.PagedResponse;
import com.capstone.be.dto.request.organization.ApproveOrganizationRequest;
import com.capstone.be.dto.response.organization.PendingOrganizationResponse;
import com.capstone.be.service.OrganizationApprovalService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for Business Admin to manage organization approvals
 * Only accessible by users with BUSINESS_ADMIN role
 */
@Slf4j
@RestController
@RequestMapping("/admin/organizations")
@RequiredArgsConstructor
public class OrganizationApprovalController {

  private final OrganizationApprovalService organizationApprovalService;

  /**
   * Get all pending organizations (paginated)
   * GET /api/v1/admin/organizations/pending
   */
  @GetMapping("/pending")
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  public ResponseEntity<PagedResponse<PendingOrganizationResponse>> getPendingOrganizations(
      Pageable pageable) {
    log.info("Get pending organizations request - page: {}, size: {}",
        pageable.getPageNumber(), pageable.getPageSize());

    Page<PendingOrganizationResponse> page = organizationApprovalService.getPendingOrganizations(
        pageable);

    PagedResponse<PendingOrganizationResponse> response = PagedResponse.<PendingOrganizationResponse>builder()
        .success(true)
        .message("Pending organizations retrieved successfully")
        .data(page.getContent())
        .pageInfo(PageInfo.from(page))
        .build();

    return ResponseEntity.ok(response);
  }

  /**
   * Get specific pending organization details
   * GET /api/v1/admin/organizations/pending/{adminUserId}
   */
  @GetMapping("/pending/{adminUserId}")
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  public ResponseEntity<PendingOrganizationResponse> getPendingOrganizationById(
      @PathVariable("adminUserId") UUID adminUserId) {
    log.info("Get pending organization by admin user id: {}", adminUserId);
    PendingOrganizationResponse response = organizationApprovalService.getPendingOrganizationById(
        adminUserId);
    return ResponseEntity.ok(response);
  }

  /**
   * Approve or reject an organization registration
   * POST /api/v1/admin/organizations/approve
   */
  @PostMapping("/approve")
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  public ResponseEntity<Void> approveOrRejectOrganization(
      @Valid @RequestBody ApproveOrganizationRequest request) {
    log.info("Approve/Reject organization request - adminUserId: {}, approved: {}",
        request.getUserId(), request.getApproved());

    organizationApprovalService.approveOrRejectOrganization(request);

    return ResponseEntity.noContent().build();
  }
}
