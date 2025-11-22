package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.ReviewerProfile;
import com.capstone.be.domain.entity.User;
import com.capstone.be.dto.request.reviewer.UpdateReviewerProfileRequest;
import com.capstone.be.dto.response.reviewer.ReviewerProfileResponse;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.repository.ReviewerProfileRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.service.FileStorageService;
import com.capstone.be.service.ReviewerService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewerServiceImpl implements ReviewerService {

  private final UserRepository userRepository;
  private final ReviewerProfileRepository reviewerProfileRepository;
  private final FileStorageService fileStorageService;

  @Override
  @Transactional(readOnly = true)
  public ReviewerProfileResponse getProfile(UUID userId) {
    log.info("Getting reviewer profile for user ID: {}", userId);

    // Get user
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

    // Get reviewer profile
    ReviewerProfile reviewerProfile = reviewerProfileRepository.findByUserId(userId)
        .orElseThrow(() -> new ResourceNotFoundException(
            "Reviewer profile not found for user ID: " + userId));

    // Force initialization of lazy-loaded collection
    reviewerProfile.getCredentialFileUrls().size();

    // Build response
    return buildProfileResponse(user, reviewerProfile);
  }

  @Override
  @Transactional
  public ReviewerProfileResponse updateProfile(UUID userId, UpdateReviewerProfileRequest request) {
    log.info("Updating reviewer profile for user ID: {}", userId);

    // Get user
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

    // Get reviewer profile
    ReviewerProfile reviewerProfile = reviewerProfileRepository.findByUserId(userId)
        .orElseThrow(
            () -> new ResourceNotFoundException(
                "Reviewer profile not found for user ID: " + userId));

    // Force initialization of lazy-loaded collection
    reviewerProfile.getCredentialFileUrls().size();

    // Update user fields (only if provided)
    if (request.getFullName() != null) {
      user.setFullName(request.getFullName());
    }

    // Update reviewer profile fields (only if provided)
    if (request.getDateOfBirth() != null) {
      reviewerProfile.setDateOfBirth(request.getDateOfBirth());
    }
    if (request.getOrdid() != null) {
      reviewerProfile.setOrdid(request.getOrdid());
    }
    if (request.getEducationLevel() != null) {
      reviewerProfile.setEducationLevel(request.getEducationLevel());
    }
    if (request.getOrganizationName() != null) {
      reviewerProfile.setOrganizationName(request.getOrganizationName());
    }
    if (request.getOrganizationEmail() != null) {
      reviewerProfile.setOrganizationEmail(request.getOrganizationEmail());
    }

    // Save changes
    userRepository.save(user);
    reviewerProfileRepository.save(reviewerProfile);

    log.info("Successfully updated profile for user ID: {}", userId);

    // Return updated profile
    return buildProfileResponse(user, reviewerProfile);
  }

  /**
   * Helper method to build profile response
   */
  private ReviewerProfileResponse buildProfileResponse(User user, ReviewerProfile reviewerProfile) {
    return ReviewerProfileResponse.builder()
        .userId(user.getId())
        .email(user.getEmail())
        .fullName(user.getFullName())
        .avatarUrl(user.getAvatarKey())
//        .point(user.getPoint())
        .status(user.getStatus())
        .dateOfBirth(reviewerProfile.getDateOfBirth())
        .ordid(reviewerProfile.getOrdid())
        .educationLevel(reviewerProfile.getEducationLevel())
        .organizationName(reviewerProfile.getOrganizationName())
        .organizationEmail(reviewerProfile.getOrganizationEmail())
        .credentialFileUrls(reviewerProfile.getCredentialFileUrls())
        .createdAt(reviewerProfile.getCreatedAt())
        .updatedAt(reviewerProfile.getUpdatedAt())
        .build();
  }
}
