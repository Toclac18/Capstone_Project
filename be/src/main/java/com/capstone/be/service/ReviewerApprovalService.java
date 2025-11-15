package com.capstone.be.service;

import com.capstone.be.dto.request.reviewer.ApproveReviewerRequest;
import com.capstone.be.dto.response.reviewer.PendingReviewerResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service for Business Admin to manage reviewer approvals
 */
public interface ReviewerApprovalService {

  /**
   * Get all pending reviewers (PENDING_APPROVE status)
   */
  Page<PendingReviewerResponse> getPendingReviewers(Pageable pageable);

  /**
   * Get details of a specific pending reviewer
   */
  PendingReviewerResponse getPendingReviewerById(UUID userId);

  /**
   * Approve or reject a reviewer registration
   * If approved: status -> ACTIVE, send welcome email
   * If rejected: status -> REJECTED, send rejection email with reason
   */
  void approveOrRejectReviewer(ApproveReviewerRequest request);
}
