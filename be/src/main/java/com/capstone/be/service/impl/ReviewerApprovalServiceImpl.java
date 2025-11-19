package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.Domain;
import com.capstone.be.domain.entity.ReviewerDomainLink;
import com.capstone.be.domain.entity.ReviewerProfile;
import com.capstone.be.domain.entity.ReviewerSpecLink;
import com.capstone.be.domain.entity.Specialization;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.domain.enums.UserStatus;
import com.capstone.be.dto.request.reviewer.ApproveReviewerRequest;
import com.capstone.be.dto.response.reviewer.PendingReviewerResponse;
import com.capstone.be.exception.InvalidRequestException;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.mapper.ReviewerApprovalMapper;
import com.capstone.be.repository.ReviewerDomainLinkRepository;
import com.capstone.be.repository.ReviewerProfileRepository;
import com.capstone.be.repository.ReviewerSpecLinkRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.service.EmailService;
import com.capstone.be.service.ReviewerApprovalService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewerApprovalServiceImpl implements ReviewerApprovalService {

  private final UserRepository userRepository;
  private final ReviewerProfileRepository reviewerProfileRepository;
  private final ReviewerDomainLinkRepository reviewerDomainLinkRepository;
  private final ReviewerSpecLinkRepository reviewerSpecLinkRepository;
  private final EmailService emailService;
  private final ReviewerApprovalMapper reviewerApprovalMapper;

  @Override
  @Transactional(readOnly = true)
  public Page<PendingReviewerResponse> getPendingReviewers(Pageable pageable) {
    // Get all users with role REVIEWER and status PENDING_APPROVE
    Page<User> pendingUsers = userRepository.findByRoleAndStatus(
        UserRole.REVIEWER,
        UserStatus.PENDING_APPROVE,
        pageable
    );

    return pendingUsers.map(this::mapToPendingReviewerResponse);
  }

  @Override
  @Transactional(readOnly = true)
  public PendingReviewerResponse getPendingReviewerById(UUID userId) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> ResourceNotFoundException.userById(userId));

    // Validate that user is a reviewer
    if (user.getRole() != UserRole.REVIEWER) {
      throw new InvalidRequestException("User is not a reviewer");
    }

    // Validate that user is in pending approval state
    if (user.getStatus() != UserStatus.PENDING_APPROVE) {
      throw new InvalidRequestException(
          "Reviewer is not in pending approval state. Current status: " + user.getStatus());
    }

    return mapToPendingReviewerResponse(user);
  }

  @Override
  @Transactional
  public void approveOrRejectReviewer(ApproveReviewerRequest request) {
    // Validate rejection reason if rejected
    if (!request.getApproved() && (request.getRejectionReason() == null
        || request.getRejectionReason().isBlank())) {
      throw new InvalidRequestException("Rejection reason is required when rejecting a reviewer");
    }

    User user = userRepository.findById(request.getReviewerId())
        .orElseThrow(() -> ResourceNotFoundException.userById(request.getReviewerId()));

    // Validate that user is a reviewer
    if (user.getRole() != UserRole.REVIEWER) {
      throw new InvalidRequestException("User is not a reviewer");
    }

    // Validate that user is in pending approval state
    if (user.getStatus() != UserStatus.PENDING_APPROVE) {
      throw new InvalidRequestException(
          "Reviewer is not in pending approval state. Current status: " + user.getStatus());
    }

    if (request.getApproved()) {
      // APPROVE: Set status to ACTIVE
      user.setStatus(UserStatus.ACTIVE);
      userRepository.save(user);
      log.info("Reviewer {} approved and activated", user.getEmail());

      // Send welcome email
      emailService.sendWelcomeEmail(user.getEmail(), user.getFullName());
    } else {
      // REJECT: Set status to REJECTED
      user.setStatus(UserStatus.REJECTED);
      userRepository.save(user);
      log.info("Reviewer {} rejected. Reason: {}", user.getEmail(), request.getRejectionReason());

      // Send rejection email with reason
      emailService.sendReviewerRejectionEmail(
          user.getEmail(),
          user.getFullName(),
          request.getRejectionReason()
      );
    }
  }

  /**
   * Helper method to map User to PendingReviewerResponse
   */
  private PendingReviewerResponse mapToPendingReviewerResponse(User user) {
    // Get reviewer profile
    ReviewerProfile reviewerProfile = reviewerProfileRepository.findByUserId(user.getId())
        .orElseThrow(() -> new ResourceNotFoundException("Reviewer profile not found"));

    // Get domains
    List<Domain> domains = reviewerDomainLinkRepository.findByReviewerId(reviewerProfile.getId())
        .stream()
        .map(ReviewerDomainLink::getDomain)
        .toList();

    // Get specializations
    List<Specialization> specializations = reviewerSpecLinkRepository.findByReviewerId(
            reviewerProfile.getId())
        .stream()
        .map(ReviewerSpecLink::getSpecialization)
        .toList();

    return reviewerApprovalMapper.toPendingReviewerResponse(
        user,
        reviewerProfile,
        domains,
        specializations
    );
  }
}
