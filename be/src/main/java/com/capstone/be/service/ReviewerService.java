package com.capstone.be.service;

import com.capstone.be.dto.request.reviewer.UpdateReviewerProfileRequest;
import com.capstone.be.dto.response.reviewer.ReviewerProfileResponse;
import java.util.UUID;
import org.springframework.web.multipart.MultipartFile;

public interface ReviewerService {

  /**
   * Get reviewer profile by user ID
   *
   * @param userId User ID
   * @return ReviewerProfileResponse
   */
  ReviewerProfileResponse getProfile(UUID userId);

  /**
   * Update reviewer profile
   *
   * @param userId  User ID
   * @param request Update profile request
   * @return Updated ReviewerProfileResponse
   */
  ReviewerProfileResponse updateProfile(UUID userId, UpdateReviewerProfileRequest request);

  /**
   * Upload avatar for reviewer
   *
   * @param userId User ID
   * @param file   Avatar image file
   * @return Updated ReviewerProfileResponse with new avatar URL
   */
  ReviewerProfileResponse uploadAvatar(UUID userId, MultipartFile file);
}
