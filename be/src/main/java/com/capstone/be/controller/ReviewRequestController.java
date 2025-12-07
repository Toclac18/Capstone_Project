package com.capstone.be.controller;

import com.capstone.be.dto.common.ApiResponse;
import com.capstone.be.dto.common.PagedResponse;
import com.capstone.be.dto.request.review.RespondReviewRequestRequest;
import com.capstone.be.dto.request.review.SubmitReviewRequest;
import com.capstone.be.dto.response.review.DocumentReviewResponse;
import com.capstone.be.dto.response.review.ReviewRequestResponse;
import com.capstone.be.security.model.UserPrincipal;
import com.capstone.be.service.ReviewRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

/**
 * Controller for Reviewer to view review requests
 */
@Slf4j
@RestController
@RequestMapping("/review-requests")
@RequiredArgsConstructor
public class ReviewRequestController {

  private final ReviewRequestService reviewRequestService;

  /**
   * View pending review document requests for the authenticated reviewer
   * GET /api/v1/review-requests/pending
   *
   * @param userPrincipal Authenticated Reviewer
   * @param page          Page number (default 0)
   * @param size          Page size (default 10)
   * @return Paginated list of pending review requests
   */
  @GetMapping("/pending")
  @PreAuthorize("hasRole('REVIEWER')")
  public ResponseEntity<PagedResponse<ReviewRequestResponse>> getPendingRequests(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @RequestParam(name = "page", defaultValue = "0") int page,
      @RequestParam(name = "size", defaultValue = "10") int size) {

    UUID reviewerId = userPrincipal.getId();
    log.info("Reviewer {} requesting pending review requests (page: {}, size: {})",
        reviewerId, page, size);

    Pageable pageable = PageRequest.of(page, size);

    Page<ReviewRequestResponse> result = reviewRequestService.getReviewerPendingRequests(
        reviewerId, pageable);

    return ResponseEntity.ok(PagedResponse.of(result, "Pending review requests retrieved successfully"));
  }

  /**
   * View all review document requests for the authenticated reviewer
   * GET /api/v1/review-requests
   *
   * @param userPrincipal Authenticated Reviewer
   * @param page          Page number (default 0)
   * @param size          Page size (default 10)
   * @return Paginated list of all review requests
   */
  @GetMapping
  @PreAuthorize("hasRole('REVIEWER')")
  public ResponseEntity<PagedResponse<ReviewRequestResponse>> getAllRequests(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @RequestParam(name = "page", defaultValue = "0") int page,
      @RequestParam(name = "size", defaultValue = "10") int size) {

    UUID reviewerId = userPrincipal.getId();
    log.info("Reviewer {} requesting all review requests (page: {}, size: {})",
        reviewerId, page, size);

    Pageable pageable = PageRequest.of(page, size);

    Page<ReviewRequestResponse> result = reviewRequestService.getReviewerAllRequests(
        reviewerId, pageable);

    return ResponseEntity.ok(PagedResponse.of(result, "All review requests retrieved successfully"));
  }

  /**
   * Respond to a review request (accept or reject)
   * PUT /api/v1/review-requests/{reviewRequestId}/respond
   *
   * @param userPrincipal   Authenticated Reviewer
   * @param reviewRequestId Review request ID
   * @param request         Response (accept/reject) with optional rejection reason
   * @return Updated review request response
   */
  @PutMapping("/{reviewRequestId}/respond")
  @PreAuthorize("hasRole('REVIEWER')")
  public ResponseEntity<ApiResponse<ReviewRequestResponse>> respondToReviewRequest(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @PathVariable(name = "reviewRequestId") UUID reviewRequestId,
      @Valid @RequestBody RespondReviewRequestRequest request) {

    UUID reviewerId = userPrincipal.getId();
    log.info("Reviewer {} responding to review request {}: accept={}",
        reviewerId, reviewRequestId, request.getAccept());

    ReviewRequestResponse response = reviewRequestService.respondToReviewRequest(
        reviewerId, reviewRequestId, request);

    String message = request.getAccept()
        ? "Review request accepted successfully"
        : "Review request rejected successfully";

    return ResponseEntity.ok(ApiResponse.success(response, message));
  }

  /**
   * View to-do review documents (ACCEPTED status only)
   * GET /api/v1/review-requests/todo
   *
   * @param userPrincipal Authenticated Reviewer
   * @param page          Page number (default 0)
   * @param size          Page size (default 10)
   * @return Paginated list of documents to review
   */
  @GetMapping("/todo")
  @PreAuthorize("hasRole('REVIEWER')")
  public ResponseEntity<PagedResponse<ReviewRequestResponse>> getToDoDocuments(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @RequestParam(name = "page", defaultValue = "0") int page,
      @RequestParam(name = "size", defaultValue = "10") int size) {

    UUID reviewerId = userPrincipal.getId();
    log.info("Reviewer {} requesting to-do documents (page: {}, size: {})",
        reviewerId, page, size);

    Pageable pageable = PageRequest.of(page, size);

    Page<ReviewRequestResponse> result = reviewRequestService.getReviewerToDoDocuments(
        reviewerId, pageable);

    return ResponseEntity.ok(PagedResponse.of(result, "To-do documents retrieved successfully"));
  }

  /**
   * Submit a review for a document (comment + decision + report file)
   * PUT /api/v1/review-requests/{reviewRequestId}/submit
   *
   * @param userPrincipal   Authenticated Reviewer
   * @param reviewRequestId Review request ID
   * @param request         Review submission with comment and decision
   * @param reportFile      Review report file (docx)
   * @return Document review response
   */
  @PutMapping(value = "/{reviewRequestId}/submit", consumes = "multipart/form-data")
  @PreAuthorize("hasRole('REVIEWER')")
  public ResponseEntity<ApiResponse<DocumentReviewResponse>> submitReview(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @PathVariable(name = "reviewRequestId") UUID reviewRequestId,
      @Valid @RequestPart(name = "request") SubmitReviewRequest request,
      @RequestPart(name = "reportFile") MultipartFile reportFile) {

    UUID reviewerId = userPrincipal.getId();
    log.info("Reviewer {} submitting review for review request {}: decision={}, file={}",
        reviewerId, reviewRequestId, request.getDecision(), reportFile.getOriginalFilename());

    DocumentReviewResponse response = reviewRequestService.submitReview(
        reviewerId, reviewRequestId, request, reportFile);

    return ResponseEntity
        .status(HttpStatus.CREATED)
        .body(ApiResponse.success(response, "Review submitted successfully"));
  }

  /**
   * View review history for the authenticated reviewer
   * GET /api/v1/review-requests/history
   *
   * @param userPrincipal Authenticated Reviewer
   * @param page          Page number (default 0)
   * @param size          Page size (default 10)
   * @return Paginated list of submitted reviews
   */
  @GetMapping("/history")
  @PreAuthorize("hasRole('REVIEWER')")
  public ResponseEntity<PagedResponse<DocumentReviewResponse>> getReviewHistory(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @RequestParam(name = "page", defaultValue = "0") int page,
      @RequestParam(name = "size", defaultValue = "10") int size) {

    UUID reviewerId = userPrincipal.getId();
    log.info("Reviewer {} requesting review history (page: {}, size: {})",
        reviewerId, page, size);

    Pageable pageable = PageRequest.of(page, size);

    Page<DocumentReviewResponse> result = reviewRequestService.getReviewerHistory(
        reviewerId, pageable);

    return ResponseEntity.ok(PagedResponse.of(result, "Review history retrieved successfully"));
  }
}
