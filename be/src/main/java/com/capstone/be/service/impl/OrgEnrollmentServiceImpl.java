package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.OrgEnrollment;
import com.capstone.be.domain.entity.OrganizationProfile;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.OrgEnrollStatus;
import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.domain.enums.UserStatus;
import com.capstone.be.dto.response.organization.InviteMembersResponse;
import com.capstone.be.dto.response.organization.InviteMembersResponse.FailedInvitation;
import com.capstone.be.dto.response.organization.OrgEnrollmentResponse;
import com.capstone.be.exception.BusinessException;
import com.capstone.be.exception.InvalidRequestException;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.mapper.OrgEnrollmentMapper;
import com.capstone.be.repository.OrgEnrollmentRepository;
import com.capstone.be.repository.OrganizationProfileRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.repository.specification.OrgEnrollmentSpecification;
import com.capstone.be.service.EmailService;
import com.capstone.be.service.OrgEnrollmentService;
import com.capstone.be.util.ExcelUtil;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrgEnrollmentServiceImpl implements OrgEnrollmentService {

  private final OrgEnrollmentRepository orgEnrollmentRepository;
  private final OrganizationProfileRepository organizationProfileRepository;
  private final UserRepository userRepository;
  private final EmailService emailService;
  private final OrgEnrollmentMapper orgEnrollmentMapper;

  @Override
  @Transactional
  public InviteMembersResponse inviteMembers(UUID organizationAdminId, List<String> emails) {
    log.info("Inviting {} members for organization admin: {}", emails.size(), organizationAdminId);

    // Get organization
    OrganizationProfile organization = getOrganizationByAdminId(organizationAdminId);

    // Process invitations
    return processInvitations(organization, emails);
  }

  @Override
  @Transactional
  public InviteMembersResponse inviteMembersByExcel(UUID organizationAdminId, MultipartFile file) {
    log.info("Inviting members via Excel for organization admin: {}", organizationAdminId);

    // Validate Excel file
    ExcelUtil.validateExcelFile(file);

    // Parse emails from Excel
    List<String> emails = ExcelUtil.parseEmailListFromExcel(file);

    if (emails.isEmpty()) {
      throw new InvalidRequestException("No valid emails found in Excel file");
    }

    // Get organization
    OrganizationProfile organization = getOrganizationByAdminId(organizationAdminId);

    // Process invitations
    return processInvitations(organization, emails);
  }

  private InviteMembersResponse processInvitations(OrganizationProfile organization,
      List<String> emails) {
    List<String> successEmails = new ArrayList<>();
    List<FailedInvitation> failedInvitations = new ArrayList<>();
    List<String> skippedEmails = new ArrayList<>();

    // Query all users by emails in one batch
    Map<String, User> usersMap = userRepository.findByEmailIn(emails).stream()
        .collect(Collectors.toMap(User::getEmail, u -> u));

    // Query all existing enrollments in one batch
    Map<String, OrgEnrollment> existingEnrollmentsMap =
        orgEnrollmentRepository.findByOrganizationAndMemberEmailIn(organization, emails)
            .stream()
            .collect(Collectors.toMap(OrgEnrollment::getMemberEmail, oe -> oe));

    for (String email : emails) {
      try {
        // Check if already invited or joined
        OrgEnrollment existingEnrollment = existingEnrollmentsMap.get(email);

        if (existingEnrollment != null) {
          // Skip if already pending or joined
          if (existingEnrollment.getStatus() == OrgEnrollStatus.PENDING_INVITE ||
              existingEnrollment.getStatus() == OrgEnrollStatus.JOINED) {
            skippedEmails.add(email);
            log.info("Skipped email (already invited/joined): {}", email);
            continue;
          }

          // If removed, update to pending again
          if (existingEnrollment.getStatus() == OrgEnrollStatus.REMOVED) {
            existingEnrollment.setStatus(OrgEnrollStatus.PENDING_INVITE);
            orgEnrollmentRepository.save(existingEnrollment);

            // Send invitation email
            sendInvitationEmail(existingEnrollment, organization);
            successEmails.add(email);
            log.info("Re-invited removed member: {}", email);
            continue;
          }
        }

        // Find user from cached map
        User user = usersMap.get(email);

        if (user == null) {
          failedInvitations.add(FailedInvitation.builder()
              .email(email)
              .reason("User not found")
              .build());
          continue;
        }

        // Check if user is a reader
        if (user.getRole() != UserRole.READER) {
          failedInvitations.add(FailedInvitation.builder()
              .email(email)
              .reason("Only readers can be invited")
              .build());
          continue;
        }

        // Check if user is active
        if (user.getStatus() != UserStatus.ACTIVE) {
          failedInvitations.add(FailedInvitation.builder()
              .email(email)
              .reason("User account is not active")
              .build());
          continue;
        }

        // Create new enrollment
        OrgEnrollment enrollment = OrgEnrollment.builder()
            .organization(organization)
            .member(user)
            .memberEmail(email)
            .status(OrgEnrollStatus.PENDING_INVITE)
            .build();

        orgEnrollmentRepository.save(enrollment);

        // Send invitation email
        sendInvitationEmail(enrollment, organization);

        successEmails.add(email);
        log.info("Successfully invited: {}", email);

      } catch (Exception e) {
        log.error("Error inviting email: {}", email, e);
        failedInvitations.add(FailedInvitation.builder()
            .email(email)
            .reason(e.getMessage())
            .build());
      }
    }

    return InviteMembersResponse.builder()
        .totalEmails(emails.size())
        .successCount(successEmails.size())
        .successEmails(successEmails)
        .failedCount(failedInvitations.size())
        .failedInvitations(failedInvitations)
        .skippedCount(skippedEmails.size())
        .skippedEmails(skippedEmails)
        .build();
  }

  private void sendInvitationEmail(OrgEnrollment enrollment, OrganizationProfile organization) {
    try {
      emailService.sendOrganizationInvitation(
          enrollment.getMemberEmail(),
          enrollment.getMember().getFullName(),
          organization.getName(),
          enrollment.getId()
      );
    } catch (Exception e) {
      log.error("Failed to send invitation email to: {}", enrollment.getMemberEmail(), e);
      // Don't throw exception - enrollment is already created
    }
  }

  @Override
  @Transactional(readOnly = true)
  public Page<OrgEnrollmentResponse> getOrganizationMembers(
      UUID organizationAdminId,
      OrgEnrollStatus status,
      String search,
      Pageable pageable) {
    log.info("Get organization members for admin: {}, status: {}, search: {}",
        organizationAdminId, status, search);

    OrganizationProfile organization = getOrganizationByAdminId(organizationAdminId);

    // Use Specification for dynamic query with optional filters
    Specification<OrgEnrollment> spec = OrgEnrollmentSpecification.withFilters(
        organization, status, search);

    Page<OrgEnrollment> enrollments = orgEnrollmentRepository.findAll(spec, pageable);

    return enrollments.map(this::buildEnrollmentResponse);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<OrgEnrollmentResponse> getMyPendingInvitations(UUID readerId, Pageable pageable) {
    log.info("Get pending invitations for reader: {}", readerId);

    User reader = getUserById(readerId);
    validateUserIsReader(reader);

    Page<OrgEnrollment> enrollments = orgEnrollmentRepository.findByMemberAndStatus(
        reader, OrgEnrollStatus.PENDING_INVITE, pageable);

    return enrollments.map(this::buildEnrollmentResponse);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<OrgEnrollmentResponse> getMyOrganizations(UUID readerId, Pageable pageable) {
    log.info("Get joined organizations for reader: {}", readerId);

    User reader = getUserById(readerId);
    validateUserIsReader(reader);

    Page<OrgEnrollment> enrollments = orgEnrollmentRepository.findByMemberAndStatus(
        reader, OrgEnrollStatus.JOINED, pageable);

    return enrollments.map(this::buildEnrollmentResponse);
  }

  @Override
  @Transactional
  public void acceptInvitation(UUID readerId, UUID enrollmentId) {
    log.info("Reader {} accepting invitation {}", readerId, enrollmentId);

    User reader = getUserById(readerId);
    validateUserIsReader(reader);

    OrgEnrollment enrollment = getEnrollmentById(enrollmentId);

    // Validate enrollment belongs to reader
    if (!enrollment.getMember().getId().equals(readerId)) {
      throw new BusinessException(
          "Enrollment does not belong to this user",
          HttpStatus.FORBIDDEN,
          "ENROLLMENT_FORBIDDEN"
      );
    }

    // Validate status is pending
    if (enrollment.getStatus() != OrgEnrollStatus.PENDING_INVITE) {
      throw new InvalidRequestException("Enrollment is not in pending status");
    }

    // Accept invitation
    enrollment.acceptInvitation();
    orgEnrollmentRepository.save(enrollment);

    log.info("Reader {} successfully joined organization {}", readerId,
        enrollment.getOrganization().getName());
  }

  @Override
  @Transactional
  public void rejectInvitation(UUID readerId, UUID enrollmentId) {
    log.info("Reader {} rejecting invitation {}", readerId, enrollmentId);

    User reader = getUserById(readerId);
    validateUserIsReader(reader);

    OrgEnrollment enrollment = getEnrollmentById(enrollmentId);

    // Validate enrollment belongs to reader
    if (!enrollment.getMember().getId().equals(readerId)) {
      throw new BusinessException(
          "Enrollment does not belong to this user",
          HttpStatus.FORBIDDEN,
          "ENROLLMENT_FORBIDDEN"
      );
    }

    // Validate status is pending
    if (enrollment.getStatus() != OrgEnrollStatus.PENDING_INVITE) {
      throw new InvalidRequestException("Enrollment is not in pending status");
    }

    // Reject invitation
    enrollment.rejectInvitation();
    orgEnrollmentRepository.save(enrollment);

    log.info("Reader {} rejected invitation from organization {}", readerId,
        enrollment.getOrganization().getName());
  }

  @Override
  @Transactional
  public void removeMember(UUID organizationAdminId, UUID enrollmentId) {
    log.info("Organization admin {} removing member {}", organizationAdminId, enrollmentId);

    OrganizationProfile organization = getOrganizationByAdminId(organizationAdminId);
    OrgEnrollment enrollment = getEnrollmentById(enrollmentId);

    // Validate enrollment belongs to organization
    if (!enrollment.getOrganization().getId().equals(organization.getId())) {
      throw new BusinessException(
          "Enrollment does not belong to this organization",
          HttpStatus.FORBIDDEN,
          "ENROLLMENT_FORBIDDEN"
      );
    }

    // Remove member
    enrollment.removeMember();
    orgEnrollmentRepository.save(enrollment);

    log.info("Organization admin {} successfully removed member {}", organizationAdminId,
        enrollment.getMember().getEmail());
  }

  @Override
  @Transactional(readOnly = true)
  public OrgEnrollmentResponse getEnrollmentDetail(UUID enrollmentId) {
    log.info("Get enrollment detail: {}", enrollmentId);

    OrgEnrollment enrollment = getEnrollmentById(enrollmentId);
    return buildEnrollmentResponse(enrollment);
  }

  // Helper methods

  private OrganizationProfile getOrganizationByAdminId(UUID adminId) {
    return organizationProfileRepository.findByAdminId(adminId)
        .orElseThrow(() -> new ResourceNotFoundException(
            "Organization", "admin_id", adminId));
  }

  private User getUserById(UUID userId) {
    return userRepository.findById(userId)
        .orElseThrow(() -> ResourceNotFoundException.userById(userId));
  }

  private OrgEnrollment getEnrollmentById(UUID enrollmentId) {
    return orgEnrollmentRepository.findById(enrollmentId)
        .orElseThrow(() -> new ResourceNotFoundException(
            "Enrollment", "id", enrollmentId));
  }

  private void validateUserIsReader(User user) {
    if (user.getRole() != UserRole.READER) {
      throw new BusinessException(
          "User is not a reader",
          HttpStatus.FORBIDDEN,
          "NOT_READER"
      );
    }
  }

  private OrgEnrollmentResponse buildEnrollmentResponse(OrgEnrollment enrollment) {
    return orgEnrollmentMapper.toResponse(enrollment);
  }
}
