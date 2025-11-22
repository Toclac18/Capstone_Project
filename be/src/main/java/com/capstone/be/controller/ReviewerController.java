package com.capstone.be.controller;

import com.capstone.be.dto.request.reviewer.UpdateReviewerProfileRequest;
import com.capstone.be.dto.response.reviewer.ReviewerProfileResponse;
import com.capstone.be.security.model.UserPrincipal;
import com.capstone.be.service.ReviewerService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for Reviewer-specific operations
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/reviewer")
@RequiredArgsConstructor
public class ReviewerController {

  private final ReviewerService reviewerService;

  /**
   * Get reviewer profile
   * GET /api/v1/reviewer/profile
   *
   * @param userPrincipal Spring Security authentication Principal
   * @return ReviewerProfileResponse
   */
  @GetMapping("/profile")
  @PreAuthorize("hasRole('REVIEWER')")
  public ResponseEntity<ReviewerProfileResponse> getProfile(
      @AuthenticationPrincipal UserPrincipal userPrincipal) {
    UUID userId = userPrincipal.getId();
    log.info("Get profile request for reviewer user ID: {}", userId);

    ReviewerProfileResponse response = reviewerService.getProfile(userId);

    return ResponseEntity.ok(response);
  }

  /**
   * Update reviewer profile PUT /api/v1/reviewer/profile
   *
   * @param userPrincipal Spring Security authentication Principal
   * @param request        Update profile request
   * @return Updated ReviewerProfileResponse
   */
  @PutMapping("/profile")
  @PreAuthorize("hasRole('REVIEWER')")
  public ResponseEntity<ReviewerProfileResponse> updateProfile(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @Valid @RequestBody UpdateReviewerProfileRequest request) {
    UUID userId = userPrincipal.getId();
    log.info("Update profile request for reviewer user ID: {}", userId);

    ReviewerProfileResponse response = reviewerService.updateProfile(userId, request);

    return ResponseEntity.ok(response);
  }

}
