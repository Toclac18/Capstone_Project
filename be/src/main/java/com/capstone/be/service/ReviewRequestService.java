package com.capstone.be.service;

import com.capstone.be.dto.request.review.ApproveReviewResultRequest;
import com.capstone.be.dto.request.review.AssignReviewerRequest;
import com.capstone.be.dto.request.review.RespondReviewRequestRequest;
import com.capstone.be.dto.request.review.ReviewHistoryFilterRequest;
import com.capstone.be.dto.request.review.SubmitReviewRequest;
import com.capstone.be.dto.response.review.ReviewResultResponse;
import com.capstone.be.dto.response.review.ReviewRequestResponse;
import com.capstone.be.domain.enums.ReviewResultStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

/**
 * Service interface for review request management
 */
public interface ReviewRequestService {

  /**
   * Assign a reviewer to review a document (BA assigns)
   * Only premium documents with PENDING_REVIEW status can be assigned
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

  /**
   * Respond to a review request (accept or reject)
   *
   * @param reviewerId       Reviewer ID
   * @param reviewRequestId  Review request ID
   * @param request          Response (accept/reject) with optional rejection reason
   * @return Updated review request response
   */
  ReviewRequestResponse respondToReviewRequest(UUID reviewerId, UUID reviewRequestId, RespondReviewRequestRequest request);

  /**
   * View all documents assigned for review (ACCEPTED status only)
   * This is for "To Do" list of documents the reviewer needs to review
   *
   * @param reviewerId Reviewer ID
   * @param pageable   Pagination parameters
   * @return Page of review request responses with ACCEPTED status
   */
  Page<ReviewRequestResponse> getReviewerToDoDocuments(UUID reviewerId, Pageable pageable);

  /**
   * Business Admin - View all review requests for a specific document
   *
   * @param documentId Document ID
   * @param pageable   Pagination parameters
   * @return Page of review request responses for the document
   */
  Page<ReviewRequestResponse> getDocumentReviewRequests(UUID documentId, Pageable pageable);

  /**
   * Business Admin - View all review requests in the system
   *
   * @param pageable Pagination parameters
   * @return Page of all review request responses
   */
  Page<ReviewRequestResponse> getAllReviewRequests(Pageable pageable);

  /**
   * Submit a review for a document (reviewer submits comment, decision, and report file)
   * Updates document status to ACTIVE or REJECTED based on decision
   *
   * @param reviewerId       Reviewer ID
   * @param reviewRequestId  Review request ID
   * @param request          Review submission with comment and decision
   * @param reportFile       Review report file (docx)
   * @return Document review response
   */
  ReviewResultResponse submitReview(UUID reviewerId, UUID reviewRequestId, SubmitReviewRequest request, org.springframework.web.multipart.MultipartFile reportFile);

  /**
   * View review history for a reviewer (all reviews submitted by the reviewer)
   * with optional filters
   *
   * @param reviewerId Reviewer ID
   * @param filter     Filter criteria (optional)
   * @param pageable   Pagination parameters
   * @return Page of document review responses
   */
  Page<ReviewResultResponse> getReviewerHistory(UUID reviewerId, ReviewHistoryFilterRequest filter, Pageable pageable);

  /**
   * Business Admin - Get document review by review request ID
   *
   * @param reviewRequestId Review request ID
   * @return Document review response
   */
  ReviewResultResponse getReviewResultByReviewRequestId(UUID reviewRequestId);

  /**
   * Business Admin - Get all pending review results (PENDING status)
   * These are reviews submitted by reviewers waiting for BA approval
   *
   * @param pageable Pagination parameters
   * @return Page of document review responses with PENDING status
   */
  Page<ReviewResultResponse> getPendingReviewResults(Pageable pageable);

  /**
   * Business Admin - Get all review results with optional status filter
   *
   * @param status   Optional status filter (null = all)
   * @param pageable Pagination parameters
   * @return Page of document review responses
   */
  Page<ReviewResultResponse> getAllReviewResults(ReviewResultStatus status, Pageable pageable);

  /**
   * Business Admin - Approve or reject a review result
   * If approved: apply reviewer's decision to document (ACTIVE or REJECTED)
   * If rejected: document goes back to REVIEWING, reviewer must re-review
   *
   * @param businessAdminId Business Admin ID
   * @param reviewId        Document review ID
   * @param request         Approval request
   * @return Updated document review response
   */
  ReviewResultResponse approveReviewResult(UUID businessAdminId, UUID reviewId, ApproveReviewResultRequest request);
}
