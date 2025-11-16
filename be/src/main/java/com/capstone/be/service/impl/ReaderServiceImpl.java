package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.ReaderProfile;
import com.capstone.be.domain.entity.User;
import com.capstone.be.dto.response.reader.ReaderProfileResponse;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.repository.ReaderProfileRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.service.ReaderService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReaderServiceImpl implements ReaderService {

  private final UserRepository userRepository;
  private final ReaderProfileRepository readerProfileRepository;

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
