package com.capstone.be.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.capstone.be.domain.entity.ReviewerProfile;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.UserStatus;
import com.capstone.be.dto.request.reviewer.ApproveReviewerRequest;
import com.capstone.be.dto.response.reviewer.PendingReviewerResponse;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.repository.ReviewerProfileRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.service.EmailService;
import com.capstone.be.service.impl.ReviewerApprovalServiceImpl;
import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@ExtendWith(MockitoExtension.class)
@DisplayName("ReviewerApprovalService Unit Tests")
class ReviewerApprovalServiceTest {

  @Mock
  private UserRepository userRepository;

  @Mock
  private ReviewerProfileRepository reviewerProfileRepository;

  @Mock
  private com.capstone.be.repository.ReviewerDomainLinkRepository reviewerDomainLinkRepository;

  @Mock
  private com.capstone.be.repository.ReviewerSpecLinkRepository reviewerSpecLinkRepository;

  @Mock
  private EmailService emailService;

  @Mock
  private com.capstone.be.mapper.ReviewerApprovalMapper reviewerApprovalMapper;

  @InjectMocks
  private ReviewerApprovalServiceImpl reviewerApprovalService;

  private User reviewer;
  private ReviewerProfile reviewerProfile;
  private UUID userId;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();

    reviewer = User.builder()
        .id(userId)
        .email("reviewer@example.com")
        .fullName("Test Reviewer")
        .status(UserStatus.PENDING_APPROVE)
        .role(com.capstone.be.domain.enums.UserRole.REVIEWER)
        .build();

    reviewerProfile = ReviewerProfile.builder()
        .id(UUID.randomUUID())
        .user(reviewer)
        .build();
  }

  // test getPendingReviewers should return paginated pending reviewers
  @Test
  @DisplayName("getPendingReviewers should return paginated pending reviewers")
  void getPendingReviewers_ShouldReturnPaginatedReviewers() {
    Pageable pageable = PageRequest.of(0, 10);
    reviewer.setRole(com.capstone.be.domain.enums.UserRole.REVIEWER);
    reviewer.setStatus(UserStatus.PENDING_APPROVE);
    Page<User> userPage = new PageImpl<>(Arrays.asList(reviewer), pageable, 1);

    when(userRepository.findByRoleAndStatus(
        com.capstone.be.domain.enums.UserRole.REVIEWER, UserStatus.PENDING_APPROVE, pageable))
        .thenReturn(userPage);
    when(reviewerProfileRepository.findByUserId(userId))
        .thenReturn(Optional.of(reviewerProfile));
    when(reviewerDomainLinkRepository.findByReviewerId(any(UUID.class))).thenReturn(Arrays.asList());
    when(reviewerSpecLinkRepository.findByReviewerId(any(UUID.class))).thenReturn(Arrays.asList());
    when(reviewerApprovalMapper.toPendingReviewerResponse(any(User.class), any(com.capstone.be.domain.entity.ReviewerProfile.class), any(), any()))
        .thenReturn(com.capstone.be.dto.response.reviewer.PendingReviewerResponse.builder()
            .userId(userId)
            .build());

    Page<PendingReviewerResponse> result = reviewerApprovalService.getPendingReviewers(pageable);

    assertEquals(1, result.getTotalElements());
    verify(userRepository, times(1)).findByRoleAndStatus(
        com.capstone.be.domain.enums.UserRole.REVIEWER, UserStatus.PENDING_APPROVE, pageable);
  }

  // test getPendingReviewerById should return reviewer
  @Test
  @DisplayName("getPendingReviewerById should return reviewer")
  void getPendingReviewerById_ShouldReturnReviewer() {
    reviewer.setRole(com.capstone.be.domain.enums.UserRole.REVIEWER);
    reviewer.setStatus(UserStatus.PENDING_APPROVE);
    when(userRepository.findById(userId)).thenReturn(Optional.of(reviewer));
    when(reviewerProfileRepository.findByUserId(userId))
        .thenReturn(Optional.of(reviewerProfile));
    when(reviewerDomainLinkRepository.findByReviewerId(any(UUID.class))).thenReturn(Arrays.asList());
    when(reviewerSpecLinkRepository.findByReviewerId(any(UUID.class))).thenReturn(Arrays.asList());
    when(reviewerApprovalMapper.toPendingReviewerResponse(any(User.class), any(com.capstone.be.domain.entity.ReviewerProfile.class), any(), any()))
        .thenReturn(com.capstone.be.dto.response.reviewer.PendingReviewerResponse.builder()
            .userId(userId)
            .build());

    PendingReviewerResponse result = reviewerApprovalService.getPendingReviewerById(userId);

    assertNotNull(result);
    assertEquals(userId, result.getUserId());
    verify(userRepository, times(1)).findById(userId);
  }

  // test getPendingReviewerById should throw exception when not found
  @Test
  @DisplayName("getPendingReviewerById should throw exception when not found")
  void getPendingReviewerById_ShouldThrowException_WhenNotFound() {
    UUID nonExistentId = UUID.randomUUID();
    when(userRepository.findById(nonExistentId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> reviewerApprovalService.getPendingReviewerById(nonExistentId));
  }

  // test approveOrRejectReviewer should approve reviewer
  @Test
  @DisplayName("approveOrRejectReviewer should approve reviewer")
  void approveOrRejectReviewer_ShouldApproveReviewer() {
    ApproveReviewerRequest request = ApproveReviewerRequest.builder()
        .reviewerId(userId)
        .approved(true)
        .build();

    when(userRepository.findById(userId)).thenReturn(Optional.of(reviewer));
    when(userRepository.save(any(User.class))).thenReturn(reviewer);

    reviewerApprovalService.approveOrRejectReviewer(request);

    assertEquals(UserStatus.ACTIVE, reviewer.getStatus());
    verify(userRepository, times(1)).save(any(User.class));
    verify(emailService, times(1)).sendWelcomeEmail(reviewer.getEmail(), reviewer.getFullName());
  }

  // test approveOrRejectReviewer should reject reviewer
  @Test
  @DisplayName("approveOrRejectReviewer should reject reviewer")
  void approveOrRejectReviewer_ShouldRejectReviewer() {
    String rejectionReason = "Insufficient credentials";
    ApproveReviewerRequest request = ApproveReviewerRequest.builder()
        .reviewerId(userId)
        .approved(false)
        .rejectionReason(rejectionReason)
        .build();

    when(userRepository.findById(userId)).thenReturn(Optional.of(reviewer));
    when(userRepository.save(any(User.class))).thenReturn(reviewer);

    reviewerApprovalService.approveOrRejectReviewer(request);

    assertEquals(UserStatus.REJECTED, reviewer.getStatus());
    verify(userRepository, times(1)).save(any(User.class));
    verify(emailService, times(1))
        .sendReviewerRejectionEmail(reviewer.getEmail(), reviewer.getFullName(), rejectionReason);
  }
}

