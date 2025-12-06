package com.capstone.be.service;

import com.capstone.be.dto.request.review.AssignReviewerRequest;
import com.capstone.be.dto.response.review.ReviewRequestResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * Service interface for review request management
 */
public interface ReviewRequestService {

  /**
   * Assign a reviewer to review a document (BA assigns)
   * Only premium documents with AI_VERIFIED status can be assigned
   *
   * @param businessAdminId Business Admin ID who assigns
   * @param documentId      Document ID to be reviewed
   * @param request         Assignment request with reviewer ID and note
   * @return Review request response
   */
  ReviewRequestResponse assignReviewer(UUID businessAdminId, UUID documentId, AssignReviewerRequest request);

  /**
   * View pending review document requests for a reviewer
   *
   * @param reviewerId Reviewer ID
   * @param pageable   Pagination parameters
   * @return Page of review request responses
   */
  Page<ReviewRequestResponse> getReviewerPendingRequests(UUID reviewerId, Pageable pageable);

  /**
   * View all review document requests for a reviewer (all statuses)
   *
   * @param reviewerId Reviewer ID
   * @param pageable   Pagination parameters
   * @return Page of review request responses
   */
  Page<ReviewRequestResponse> getReviewerAllRequests(UUID reviewerId, Pageable pageable);
}
