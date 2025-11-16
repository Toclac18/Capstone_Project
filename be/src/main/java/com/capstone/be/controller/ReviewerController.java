package com.capstone.be.controller;

import com.capstone.be.dto.request.reviewer.UpdateReviewerProfileRequest;
import com.capstone.be.dto.response.reviewer.ReviewerProfileResponse;
import com.capstone.be.service.ReviewerService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

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
   * @param authentication Spring Security authentication
   * @return ReviewerProfileResponse
   */
  @GetMapping("/profile")
  @PreAuthorize("hasRole('REVIEWER')")
  public ResponseEntity<ReviewerProfileResponse> getProfile(Authentication authentication) {
    UUID userId = UUID.fromString(authentication.getName());
    log.info("Get profile request for reviewer user ID: {}", userId);

    ReviewerProfileResponse response = reviewerService.getProfile(userId);

    return ResponseEntity.ok(response);
  }

  /**
   * Update reviewer profile PUT /api/v1/reviewer/profile
   *
   * @param authentication Spring Security authentication
   * @param request        Update profile request
   * @return Updated ReviewerProfileResponse
   */
  @PutMapping("/profile")
  @PreAuthorize("hasRole('REVIEWER')")
  public ResponseEntity<ReviewerProfileResponse> updateProfile(
      Authentication authentication,
      @Valid @RequestBody UpdateReviewerProfileRequest request) {
    UUID userId = UUID.fromString(authentication.getName());
    log.info("Update profile request for reviewer user ID: {}", userId);

    ReviewerProfileResponse response = reviewerService.updateProfile(userId, request);

    return ResponseEntity.ok(response);
  }

  /**
   * Upload avatar for reviewer POST /api/v1/reviewer/profile/avatar
   *
   * @param authentication Spring Security authentication
   * @param file           Avatar image file
   * @return Updated ReviewerProfileResponse with new avatar URL
   */
  @PostMapping("/profile/avatar")
  @PreAuthorize("hasRole('REVIEWER')")
  public ResponseEntity<ReviewerProfileResponse> uploadAvatar(
      Authentication authentication,
      @RequestParam(value = "file") MultipartFile file) {
    UUID userId = UUID.fromString(authentication.getName());
    log.info("Upload avatar request for reviewer user ID: {}", userId);

    ReviewerProfileResponse response = reviewerService.uploadAvatar(userId, file);

    return ResponseEntity.ok(response);
  }
}
