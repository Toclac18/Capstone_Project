package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.OrganizationProfile;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.domain.enums.UserStatus;
import com.capstone.be.dto.request.organization.ApproveOrganizationRequest;
import com.capstone.be.dto.response.organization.PendingOrganizationResponse;
import com.capstone.be.exception.InvalidRequestException;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.mapper.OrganizationApprovalMapper;
import com.capstone.be.repository.OrganizationProfileRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.service.EmailService;
import com.capstone.be.service.OrganizationApprovalService;
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
public class OrganizationApprovalServiceImpl implements OrganizationApprovalService {

  private final UserRepository userRepository;
  private final OrganizationProfileRepository organizationProfileRepository;
  private final EmailService emailService;
  private final OrganizationApprovalMapper organizationApprovalMapper;

  @Override
  @Transactional(readOnly = true)
  public Page<PendingOrganizationResponse> getPendingOrganizations(Pageable pageable) {
    // Get all users with role ORGANIZATION_ADMIN and status PENDING_APPROVE
    Page<User> pendingAdmins = userRepository.findByRoleAndStatus(
        UserRole.ORGANIZATION_ADMIN,
        UserStatus.PENDING_APPROVE,
        pageable
    );

    return pendingAdmins.map(this::mapToPendingOrganizationResponse);
  }

  @Override
  @Transactional(readOnly = true)
  public PendingOrganizationResponse getPendingOrganizationById(UUID adminUserId) {
    User admin = userRepository.findById(adminUserId)
        .orElseThrow(() -> ResourceNotFoundException.userById(adminUserId));

    // Validate that user is an organization admin
    if (admin.getRole() != UserRole.ORGANIZATION_ADMIN) {
      throw new InvalidRequestException("User is not an organization admin");
    }

    // Validate that user is in pending approval state
    if (admin.getStatus() != UserStatus.PENDING_APPROVE) {
      throw new InvalidRequestException(
          "Organization is not in pending approval state. Current status: " + admin.getStatus());
    }

    return mapToPendingOrganizationResponse(admin);
  }

  @Override
  @Transactional
  public void approveOrRejectOrganization(ApproveOrganizationRequest request) {
    // Validate rejection reason if rejected
    if (!request.getApproved() && (request.getRejectionReason() == null
        || request.getRejectionReason().isBlank())) {
      throw new InvalidRequestException(
          "Rejection reason is required when rejecting an organization");
    }

    User admin = userRepository.findById(request.getUserId())
        .orElseThrow(() -> ResourceNotFoundException.userById(request.getUserId()));

    // Validate that user is an organization admin
    if (admin.getRole() != UserRole.ORGANIZATION_ADMIN) {
      throw new InvalidRequestException("User is not an organization admin");
    }

    // Validate that user is in pending approval state
    if (admin.getStatus() != UserStatus.PENDING_APPROVE) {
      throw new InvalidRequestException(
          "Organization is not in pending approval state. Current status: " + admin.getStatus());
    }

    if (request.getApproved()) {
      // APPROVE: Set status to ACTIVE
      admin.setStatus(UserStatus.ACTIVE);
      userRepository.save(admin);
      log.info("Organization admin {} approved and activated", admin.getEmail());

      // Send welcome email
      emailService.sendWelcomeEmail(admin.getEmail(), admin.getFullName());
    } else {
      // REJECT: Set status to REJECTED
      admin.setStatus(UserStatus.REJECTED);
      userRepository.save(admin);
      log.info("Organization admin {} rejected. Reason: {}", admin.getEmail(),
          request.getRejectionReason());

      // Send rejection email with reason
      emailService.sendOrganizationRejectionEmail(
          admin.getEmail(),
          admin.getFullName(),
          request.getRejectionReason()
      );
    }
  }

  /**
   * Helper method to map User (admin) to PendingOrganizationResponse
   */
  private PendingOrganizationResponse mapToPendingOrganizationResponse(User admin) {
    // Get organization profile
    OrganizationProfile organizationProfile = organizationProfileRepository.findByAdminId(
            admin.getId())
        .orElseThrow(() -> new ResourceNotFoundException("Organization profile not found"));

    return organizationApprovalMapper.toPendingOrganizationResponse(admin, organizationProfile);
  }
}
