package com.capstone.be.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.capstone.be.domain.entity.ReviewerProfile;
import com.capstone.be.domain.entity.User;
import com.capstone.be.dto.request.reviewer.UpdateReviewerProfileRequest;
import com.capstone.be.dto.response.reviewer.ReviewerProfileResponse;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.repository.ReviewerProfileRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.service.impl.ReviewerServiceImpl;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("ReviewerService Unit Tests")
class ReviewerServiceTest {

  @Mock
  private UserRepository userRepository;

  @Mock
  private ReviewerProfileRepository reviewerProfileRepository;

  @InjectMocks
  private ReviewerServiceImpl reviewerService;

  private User user;
  private ReviewerProfile reviewerProfile;
  private UUID userId;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();

    user = User.builder()
        .id(userId)
        .email("reviewer@example.com")
        .fullName("Test Reviewer")
        .build();

    reviewerProfile = ReviewerProfile.builder()
        .id(UUID.randomUUID())
        .user(user)
        .build();
  }

  // test getProfile should return reviewer profile
  @Test
  @DisplayName("getProfile should return reviewer profile")
  void getProfile_ShouldReturnProfile() {
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(reviewerProfileRepository.findByUserId(userId)).thenReturn(Optional.of(reviewerProfile));

    ReviewerProfileResponse result = reviewerService.getProfile(userId);

    assertNotNull(result);
    assertEquals(userId, result.getUserId());
    verify(reviewerProfileRepository, times(1)).findByUserId(userId);
  }

  // test getProfile should throw exception when user not found
  @Test
  @DisplayName("getProfile should throw exception when user not found")
  void getProfile_ShouldThrowException_WhenUserNotFound() {
    when(userRepository.findById(userId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> reviewerService.getProfile(userId));
    verify(reviewerProfileRepository, never()).findByUserId(any());
  }

  // test getProfile should throw exception when profile not found
  @Test
  @DisplayName("getProfile should throw exception when profile not found")
  void getProfile_ShouldThrowException_WhenProfileNotFound() {
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(reviewerProfileRepository.findByUserId(userId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> reviewerService.getProfile(userId));
  }

  // test updateProfile should update profile successfully
  @Test
  @DisplayName("updateProfile should update profile successfully")
  void updateProfile_ShouldUpdateProfile() {
    UpdateReviewerProfileRequest request = UpdateReviewerProfileRequest.builder()
        .fullName("Updated Name")
        .build();

    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(reviewerProfileRepository.findByUserId(userId)).thenReturn(Optional.of(reviewerProfile));
    when(userRepository.save(any(User.class))).thenReturn(user);
    when(reviewerProfileRepository.save(any(ReviewerProfile.class))).thenReturn(reviewerProfile);

    ReviewerProfileResponse result = reviewerService.updateProfile(userId, request);

    assertNotNull(result);
    verify(userRepository, times(1)).save(any(User.class));
    verify(reviewerProfileRepository, times(1)).save(any(ReviewerProfile.class));
  }
}


