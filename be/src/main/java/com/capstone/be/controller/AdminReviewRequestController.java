package com.capstone.be.controller;

import com.capstone.be.domain.enums.ReviewResultStatus;
import com.capstone.be.dto.common.ApiResponse;
import com.capstone.be.dto.common.PagedResponse;
import com.capstone.be.dto.request.review.ApproveReviewResultRequest;
import com.capstone.be.dto.request.review.AssignReviewerRequest;
import com.capstone.be.dto.request.review.ReviewManagementFilterRequest;
import com.capstone.be.dto.response.review.ReviewResultResponse;
import com.capstone.be.dto.response.review.ReviewRequestResponse;
import com.capstone.be.dto.response.review.ReviewManagementItem;
import com.capstone.be.scheduler.ReviewRequestExpirationJob;
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

import java.util.UUID;

/**
 * Controller for Business Admin to manage review requests
 */
@Slf4j
@RestController
@RequiredArgsConstructor
public class AdminReviewRequestController {

  private final ReviewRequestService reviewRequestService;
  private final ReviewRequestExpirationJob expirationJob;

  /**
   * Assign a reviewer to review a document
   * POST /api/v1/admin/documents/{documentId}/review-requests
   *
   * @param userPrincipal Authenticated Business Admin
   * @param documentId    Document ID to be reviewed
   * @param request       Assignment request with reviewer ID and note
   * @return Review request response
   */
  @PostMapping("/admin/documents/{documentId}/review-requests")
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  public ResponseEntity<ApiResponse<ReviewRequestResponse>> assignReviewer(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @PathVariable(name = "documentId") UUID documentId,
      @Valid @RequestBody AssignReviewerRequest request) {

    UUID businessAdminId = userPrincipal.getId();
    log.info("Business Admin {} assigning reviewer {} to document {}",
        businessAdminId, request.getReviewerId(), documentId);

    ReviewRequestResponse response = reviewRequestService.assignReviewer(
        businessAdminId, documentId, request);

    return ResponseEntity
        .status(HttpStatus.CREATED)
        .body(ApiResponse.success(response, "Reviewer assigned successfully"));
  }

  /**
   * View all review requests for a specific document
   * GET /api/v1/admin/documents/{documentId}/review-requests
   *
   * @param documentId Document ID
   * @param page       Page number (default 0)
   * @param size       Page size (default 10)
   * @return Paginated list of review requests for the document
   */
  @GetMapping("/admin/documents/{documentId}/review-requests")
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  public ResponseEntity<PagedResponse<ReviewRequestResponse>> getDocumentReviewRequests(
      @PathVariable(name = "documentId") UUID documentId,
      @RequestParam(name = "page", defaultValue = "0") int page,
      @RequestParam(name = "size", defaultValue = "10") int size) {

    log.info("Business Admin requesting review requests for document {} (page: {}, size: {})",
        documentId, page, size);

    Pageable pageable = PageRequest.of(page, size);

    Page<ReviewRequestResponse> result = reviewRequestService.getDocumentReviewRequests(
        documentId, pageable);

    return ResponseEntity.ok(PagedResponse.of(result, "Document review requests retrieved successfully"));
  }

  /**
   * View all review requests in the system
   * GET /api/v1/admin/review-requests
   *
   * @param page Page number (default 0)
   * @param size Page size (default 10)
   * @return Paginated list of all review requests
   */
  @GetMapping("/admin/review-requests")
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  public ResponseEntity<PagedResponse<ReviewRequestResponse>> getAllReviewRequests(
      @RequestParam(name = "page", defaultValue = "0") int page,
      @RequestParam(name = "size", defaultValue = "10") int size) {

    log.info("Business Admin requesting all review requests (page: {}, size: {})", page, size);

    Pageable pageable = PageRequest.of(page, size);

    Page<ReviewRequestResponse> result = reviewRequestService.getAllReviewRequests(pageable);

    return ResponseEntity.ok(PagedResponse.of(result, "All review requests retrieved successfully"));
  }

  /**
   * Get document review by review request ID
   * GET /api/v1/admin/review-requests/{reviewRequestId}/review
   *
   * @param reviewRequestId Review request ID
   * @return Document review response
   */
  @GetMapping("/admin/review-requests/{reviewRequestId}/review")
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  public ResponseEntity<ApiResponse<ReviewResultResponse>> getReviewResultByReviewRequestId(
      @PathVariable(name = "reviewRequestId") UUID reviewRequestId) {

    log.info("Business Admin requesting document review for review request {}", reviewRequestId);

    ReviewResultResponse response = reviewRequestService.getReviewResultByReviewRequestId(reviewRequestId);

    return ResponseEntity.ok(ApiResponse.success(response, "Document review retrieved successfully"));
  }

  /**
   * Manually trigger review request expiration job
   * POST /api/v1/admin/review-requests/expire
   *
   * This endpoint allows Business Admin to manually trigger the expiration job
   * for testing or emergency purposes instead of waiting for scheduled midnight run
   *
   * @return Success message
   */
  @PostMapping("/admin/review-requests/expire")
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  public ResponseEntity<ApiResponse<Void>> manuallyExpireReviewRequests() {
    log.info("Business Admin manually triggering review request expiration job");

    try {
      expirationJob.runManualExpiration();
      return ResponseEntity.ok(ApiResponse.success(null, "Review request expiration job completed successfully"));
    } catch (Exception e) {
      log.error("Error during manual expiration job: {}", e.getMessage(), e);
      return ResponseEntity
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .body(ApiResponse.error("Failed to run expiration job: " + e.getMessage()));
    }
  }

  // ==================== REVIEW RESULT APPROVAL ENDPOINTS ====================

  /**
   * Get all pending review results waiting for BA approval
   * GET /api/v1/admin/review-results/pending
   *
   * @param page Page number (default 0)
   * @param size Page size (default 10)
   * @return Paginated list of pending review results
   */
  @GetMapping("/admin/review-results/pending")
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  public ResponseEntity<PagedResponse<ReviewResultResponse>> getPendingReviewResults(
      @RequestParam(name = "page", defaultValue = "0") int page,
      @RequestParam(name = "size", defaultValue = "10") int size) {

    log.info("Business Admin requesting pending review results (page: {}, size: {})", page, size);

    Pageable pageable = PageRequest.of(page, size);

    Page<ReviewResultResponse> result = reviewRequestService.getPendingReviewResults(pageable);

    return ResponseEntity.ok(PagedResponse.of(result, "Pending review results retrieved successfully"));
  }

  /**
   * Get all review results with optional status filter
   * GET /api/v1/admin/review-results
   *
   * @param status Optional status filter (PENDING, APPROVED, REJECTED)
   * @param page   Page number (default 0)
   * @param size   Page size (default 10)
   * @return Paginated list of review results
   */
  @GetMapping("/admin/review-results")
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  public ResponseEntity<PagedResponse<ReviewResultResponse>> getAllReviewResults(
      @RequestParam(name = "status", required = false) ReviewResultStatus status,
      @RequestParam(name = "page", defaultValue = "0") int page,
      @RequestParam(name = "size", defaultValue = "10") int size) {

    log.info("Business Admin requesting all review results with status: {} (page: {}, size: {})", 
        status, page, size);

    Pageable pageable = PageRequest.of(page, size);

    Page<ReviewResultResponse> result = reviewRequestService.getAllReviewResults(status, pageable);

    return ResponseEntity.ok(PagedResponse.of(result, "Review results retrieved successfully"));
  }

  /**
   * Approve or reject a review result
   * PUT /api/v1/admin/review-results/{reviewId}/approve
   *
   * If approved: apply reviewer's decision to document (ACTIVE or REJECTED)
   * If rejected: document goes back to REVIEWING, reviewer must re-review
   *
   * @param userPrincipal Authenticated Business Admin
   * @param reviewId      Document review ID
   * @param request       Approval request (approved + optional rejectionReason)
   * @return Updated document review response
   */
  @PutMapping("/admin/review-results/{reviewId}/approve")
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  public ResponseEntity<ApiResponse<ReviewResultResponse>> approveReviewResult(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @PathVariable(name = "reviewId") UUID reviewId,
      @Valid @RequestBody ApproveReviewResultRequest request) {

    UUID businessAdminId = userPrincipal.getId();
    log.info("Business Admin {} approving/rejecting review result {}: approved={}",
        businessAdminId, reviewId, request.getApproved());

    ReviewResultResponse response = reviewRequestService.approveReviewResult(
        businessAdminId, reviewId, request);

    String message = request.getApproved()
        ? "Review result approved successfully"
        : "Review result rejected. Reviewer must re-review the document.";

    return ResponseEntity.ok(ApiResponse.success(response, message));
  }

  /**
   * Business Admin Review Management aggregated view.
   * GET /api/v1/admin/review-management
   *
   * @param tab        Tab identifier: NEEDS_ASSIGNMENT, PENDING, IN_REVIEW, COMPLETED, ALL
   * @param reviewerId Optional filter by reviewer
   * @param domain     Optional filter by domain name
   * @param search     Optional search by document title
   * @param sortBy     Sort field: createdAt, title, deadline
   * @param sortOrder  Sort order: asc/desc
   * @param pageable   Pagination params
   */
  @GetMapping("/admin/review-management")
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  public ResponseEntity<PagedResponse<ReviewManagementItem>> getReviewManagementList(
      @RequestParam(name = "tab", required = false) String tab,
      @RequestParam(name = "reviewerId", required = false) java.util.UUID reviewerId,
      @RequestParam(name = "domain", required = false) String domain,
      @RequestParam(name = "search", required = false) String search,
      @RequestParam(name = "sortBy", required = false) String sortBy,
      @RequestParam(name = "sortOrder", required = false) String sortOrder,
      Pageable pageable
  ) {
    log.info("Business Admin requesting review management list - tab: {}, reviewerId: {}, domain: {}, search: {}, sortBy: {}, sortOrder: {}, page: {}, size: {}",
        tab, reviewerId, domain, search, sortBy, sortOrder, pageable.getPageNumber(), pageable.getPageSize());

    ReviewManagementFilterRequest filter = ReviewManagementFilterRequest.builder()
        .tab(tab)
        .reviewerId(reviewerId)
        .domain(domain)
        .search(search)
        .sortBy(sortBy)
        .sortOrder(sortOrder)
        .build();

    Page<ReviewManagementItem> page = reviewRequestService.getReviewManagementList(filter, pageable);

    return ResponseEntity.ok(PagedResponse.of(page, "Review management data retrieved successfully"));
  }
}
