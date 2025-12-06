package com.capstone.be.controller;

import com.capstone.be.dto.common.PagedResponse;
import com.capstone.be.dto.response.review.ReviewRequestResponse;
import com.capstone.be.security.model.UserPrincipal;
import com.capstone.be.service.ReviewRequestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

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
}
