package com.capstone.be.controller;

import com.capstone.be.dto.common.ApiResponse;
import com.capstone.be.dto.request.review.AssignReviewerRequest;
import com.capstone.be.dto.response.review.ReviewRequestResponse;
import com.capstone.be.security.model.UserPrincipal;
import com.capstone.be.service.ReviewRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
@RequestMapping("/admin/documents/{documentId}/review-requests")
@RequiredArgsConstructor
public class AdminReviewRequestController {

  private final ReviewRequestService reviewRequestService;

  /**
   * Assign a reviewer to review a document
   * POST /api/v1/admin/documents/{documentId}/review-requests
   *
   * @param userPrincipal Authenticated Business Admin
   * @param documentId    Document ID to be reviewed
   * @param request       Assignment request with reviewer ID and note
   * @return Review request response
   */
  @PostMapping
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
}
