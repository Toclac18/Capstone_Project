package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.ReaderProfile;
import com.capstone.be.domain.entity.User;
import com.capstone.be.dto.request.reader.UpdateReaderProfileRequest;
import com.capstone.be.dto.response.reader.ReaderProfileResponse;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.repository.ReaderProfileRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.service.FileStorageService;
import com.capstone.be.service.ReaderService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReaderServiceImpl implements ReaderService {

  private final UserRepository userRepository;
  private final ReaderProfileRepository readerProfileRepository;
  private final FileStorageService fileStorageService;

  @Override
  @Transactional(readOnly = true)
  public ReaderProfileResponse getProfile(UUID userId) {
    log.info("Getting reader profile for user ID: {}", userId);

    // Get user
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

    // Get reader profile
    ReaderProfile readerProfile = readerProfileRepository.findByUserId(userId)
        .orElseThrow(() -> new ResourceNotFoundException("Reader profile not found for user ID: " + userId));

    // Build response
    return buildProfileResponse(user, readerProfile);
  }

  @Override
  @Transactional
  public ReaderProfileResponse updateProfile(UUID userId, UpdateReaderProfileRequest request) {
    log.info("Updating reader profile for user ID: {}", userId);

    // Get user
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

    // Get reader profile
    ReaderProfile readerProfile = readerProfileRepository.findByUserId(userId)
        .orElseThrow(
            () -> new ResourceNotFoundException("Reader profile not found for user ID: " + userId));

    // Update user fields (only if provided)
    if (request.getFullName() != null) {
      user.setFullName(request.getFullName());
    }

    // Update reader profile fields (only if provided)
    if (request.getDob() != null) {
      readerProfile.setDob(request.getDob());
    }

    // Save changes
    userRepository.save(user);
    readerProfileRepository.save(readerProfile);

    log.info("Successfully updated profile for user ID: {}", userId);

    // Return updated profile
    return buildProfileResponse(user, readerProfile);
  }

  @Override
  @Transactional
  public ReaderProfileResponse uploadAvatar(UUID userId, MultipartFile file) {
    log.info("Uploading avatar for user ID: {}", userId);

    // Get user
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

    // Get reader profile
    ReaderProfile readerProfile = readerProfileRepository.findByUserId(userId)
        .orElseThrow(
            () -> new ResourceNotFoundException("Reader profile not found for user ID: " + userId));

    // Delete old avatar if exists
    if (user.getAvatarUrl() != null && !user.getAvatarUrl().isEmpty()) {
      try {
        fileStorageService.deleteFile(user.getAvatarUrl());
        log.info("Deleted old avatar for user ID: {}", userId);
      } catch (Exception e) {
        log.warn("Failed to delete old avatar, continuing with upload: {}", e.getMessage());
      }
    }

    // Upload new avatar to S3
    String avatarUrl = fileStorageService.uploadFile(file, "avatars", null);
    user.setAvatarUrl(avatarUrl);

    // Save user
    userRepository.save(user);

    log.info("Successfully uploaded avatar for user ID: {}", userId);

    // Return updated profile
    return buildProfileResponse(user, readerProfile);
  }

  /**
   * Helper method to build profile response
   */
  private ReaderProfileResponse buildProfileResponse(User user, ReaderProfile readerProfile) {
    return ReaderProfileResponse.builder()
        .userId(user.getId())
        .email(user.getEmail())
        .fullName(user.getFullName())
        .avatarUrl(user.getAvatarUrl())
        .point(user.getPoint())
        .status(user.getStatus())
        .dob(readerProfile.getDob())
        .createdAt(readerProfile.getCreatedAt())
        .updatedAt(readerProfile.getUpdatedAt())
        .build();
  }
}
