package com.capstone.be.controller;

import com.capstone.be.dto.common.ApiResponse;
import com.capstone.be.dto.common.PagedResponse;
import com.capstone.be.dto.request.review.AssignReviewerRequest;
import com.capstone.be.dto.response.review.ReviewRequestResponse;
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
}
