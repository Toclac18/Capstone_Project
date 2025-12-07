package com.capstone.be.service;

import com.capstone.be.dto.request.review.AssignReviewerRequest;
import com.capstone.be.dto.request.review.RespondReviewRequestRequest;
import com.capstone.be.dto.request.review.SubmitReviewRequest;
import com.capstone.be.dto.response.review.DocumentReviewResponse;
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
   * Submit a review for a document (reviewer submits report and decision)
   * Updates document status to ACTIVE or REJECTED based on decision
   *
   * @param reviewerId       Reviewer ID
   * @param reviewRequestId  Review request ID
   * @param request          Review submission with report and decision
   * @return Document review response
   */
  DocumentReviewResponse submitReview(UUID reviewerId, UUID reviewRequestId, SubmitReviewRequest request);

  /**
   * View review history for a reviewer (all reviews submitted by the reviewer)
   *
   * @param reviewerId Reviewer ID
   * @param pageable   Pagination parameters
   * @return Page of document review responses
   */
  Page<DocumentReviewResponse> getReviewerHistory(UUID reviewerId, Pageable pageable);
}
