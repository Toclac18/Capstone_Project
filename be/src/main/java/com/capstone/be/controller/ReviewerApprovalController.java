package com.capstone.be.controller;

import com.capstone.be.domain.enums.LogAction;
import com.capstone.be.dto.common.PageInfo;
import com.capstone.be.dto.common.PagedResponse;
import com.capstone.be.dto.request.reviewer.ApproveReviewerRequest;
import com.capstone.be.dto.response.reviewer.PendingReviewerResponse;
import com.capstone.be.security.model.UserPrincipal;
import com.capstone.be.service.ReviewerApprovalService;
import com.capstone.be.util.AuditLogHelper;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for Business Admin to manage reviewer approvals
 * Only accessible by users with BUSINESS_ADMIN role
 */
@Slf4j
@RestController
@RequestMapping("/admin/reviewers")
@RequiredArgsConstructor
public class ReviewerApprovalController {

  private final ReviewerApprovalService reviewerApprovalService;
  private final AuditLogHelper auditLogHelper;

  /**
   * Get all pending reviewers (paginated)
   * GET /api/v1/admin/reviewers/pending
   */
  @GetMapping("/pending")
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  public ResponseEntity<PagedResponse<PendingReviewerResponse>> getPendingReviewers(
      Pageable pageable) {
    log.info("Get pending reviewers request - page: {}, size: {}",
        pageable.getPageNumber(), pageable.getPageSize());

    Page<PendingReviewerResponse> page = reviewerApprovalService.getPendingReviewers(pageable);

    PagedResponse<PendingReviewerResponse> response = PagedResponse.<PendingReviewerResponse>builder()
        .success(true)
        .message("Pending reviewers retrieved successfully")
        .data(page.getContent())
        .pageInfo(PageInfo.from(page))
        .build();

    return ResponseEntity.ok(response);
  }

  /**
   * Get specific pending reviewer details
   * GET /api/v1/admin/reviewers/pending/{userId}
   */
  @GetMapping("/pending/{userId}")
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  public ResponseEntity<PendingReviewerResponse> getPendingReviewerById(
      @PathVariable("userId") UUID userId) {
    log.info("Get pending reviewer by id: {}", userId);
    PendingReviewerResponse response = reviewerApprovalService.getPendingReviewerById(userId);
    return ResponseEntity.ok(response);
  }

  /**
   * Approve or reject a reviewer registration
   * POST /api/v1/admin/reviewers/approve
   */
  @PostMapping("/approve")
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  public ResponseEntity<Void> approveOrRejectReviewer(
      @AuthenticationPrincipal UserPrincipal adminPrincipal,
      @Valid @RequestBody ApproveReviewerRequest request) {
    log.info("Approve/Reject reviewer request - reviewerId: {}, approved: {}",
        request.getReviewerId(), request.getApproved());

    reviewerApprovalService.approveOrRejectReviewer(request);

    // Audit log - reviewer approved or rejected
    try {
      var details = AuditLogHelper.details();
      details.put("reviewerId", request.getReviewerId().toString());
      details.put("approved", request.getApproved());
      details.put("rejectionReason", request.getRejectionReason());

      LogAction action = Boolean.TRUE.equals(request.getApproved())
          ? LogAction.REVIEWER_APPROVED
          : LogAction.REVIEWER_REJECTED;

      auditLogHelper.logSuccessWithTarget(
          action,
          adminPrincipal,
          request.getReviewerId(),
          details,
          org.springframework.http.HttpStatus.NO_CONTENT.value()
      );
    } catch (Exception e) {
      log.warn("Failed to audit log REVIEWER_APPROVED/REJECTED: {}", e.getMessage());
    }

    return ResponseEntity.noContent().build();
  }
}
