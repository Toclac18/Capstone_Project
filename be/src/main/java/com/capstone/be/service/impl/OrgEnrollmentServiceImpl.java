package com.capstone.be.service.impl;

import com.capstone.be.config.constant.FileStorage;
import com.capstone.be.domain.entity.MemberImportBatch;
import com.capstone.be.domain.entity.OrgEnrollment;
import com.capstone.be.domain.entity.OrganizationProfile;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.NotificationType;
import com.capstone.be.domain.enums.OrgEnrollStatus;
import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.domain.enums.UserStatus;
import com.capstone.be.domain.entity.ImportResultItem;
import com.capstone.be.dto.response.organization.ImportResultItemResponse;
import com.capstone.be.dto.response.organization.InviteMembersResponse;
import com.capstone.be.dto.response.organization.InviteMembersResponse.FailedInvitation;
import com.capstone.be.dto.response.organization.MemberImportBatchResponse;
import com.capstone.be.dto.response.organization.OrgEnrollmentResponse;
import com.capstone.be.exception.BusinessException;
import com.capstone.be.exception.InvalidRequestException;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.mapper.MemberImportBatchMapper;
import com.capstone.be.mapper.OrgEnrollmentMapper;
import com.capstone.be.repository.ImportResultItemRepository;
import com.capstone.be.repository.MemberImportBatchRepository;
import com.capstone.be.repository.OrgEnrollmentRepository;
import com.capstone.be.repository.OrganizationProfileRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.repository.specification.OrgEnrollmentSpecification;
import com.capstone.be.service.EmailService;
import com.capstone.be.security.jwt.JwtUtil;
import com.capstone.be.service.FileStorageService;
import com.capstone.be.service.NotificationService;
import com.capstone.be.service.OrgEnrollmentService;
import com.capstone.be.util.ExcelUtil;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.validator.routines.EmailValidator;
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
  private final OrgEnrollmentMapper orgEnrollmentMapper;
  private final MemberImportBatchRepository memberImportBatchRepository;
  private final ImportResultItemRepository importResultItemRepository;

  private final EmailService emailService;
  private final FileStorageService fileStorageService;
  private final NotificationService notificationService;
  private final JwtUtil jwtUtil;

  private final MemberImportBatchMapper memberImportBatchMapper;

  @Override
  @Transactional
  public InviteMembersResponse inviteMembers(UUID organizationAdminId, List<String> emails) {
    log.info("Inviting {} members for organization admin: {}", emails.size(), organizationAdminId);

    return handleInviteByEmail(
        organizationAdminId,
        emails,
        "MANUAL",
        null);
  }


  @Override
  @Transactional
  public InviteMembersResponse inviteMembersByExcel(UUID organizationAdminId, MultipartFile file) {
    log.info("Inviting members via Excel for organization admin: {}", organizationAdminId);

    // Validate Excel file
    ExcelUtil.validateExcelFile(file);

    // Parse emails from Excel
    List<String> emails = ExcelUtil.parseEmailListFromExcel(file);

    return handleInviteByEmail(
        organizationAdminId,
        emails,
        "EXCEL",
        file);

  }


  @Transactional
  private InviteMembersResponse handleInviteByEmail(
      UUID organizationAdminId,
      List<String> emails,
      String importSource,
      MultipartFile file
  ) {
    log.info("Inviting {} members ({}) for admin: {}",
        emails.size(), importSource, organizationAdminId);

    if (emails.isEmpty()) {
      throw new InvalidRequestException("No valid emails found");
    }

    OrganizationProfile organization = getOrganizationByAdminId(organizationAdminId);
    User admin = organization.getAdmin();

    // Create batch
    MemberImportBatch batch = createImportBatch(
        organization,
        admin,
        importSource,
        emails.size(),
        file
    );

    // process invitations
    InviteMembersResponse response = processInvitations(organization, emails, batch);

    // Update batch with statics
    batch.setSuccessCount(response.getSuccessCount());
    batch.setFailedCount(response.getFailedCount());
    batch.setSkippedCount(response.getSkippedCount());
    memberImportBatchRepository.save(batch);

    return response;
  }


  private InviteMembersResponse processInvitations(
      OrganizationProfile organization,
      List<String> emails,
      MemberImportBatch batch) {
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

    EmailValidator emailValidator = EmailValidator.getInstance();
    ZoneId zone = ZoneId.of("Asia/Ho_Chi_Minh");

    for (String email : emails) {
      try {
        // Validate email format
        if (!emailValidator.isValid(email)) {
          failedInvitations.add(FailedInvitation.builder()
              .email(email)
              .reason("Invalid email format")
              .build());
          continue;
        }

        // Check if already has enrollment
        OrgEnrollment existingEnrollment = existingEnrollmentsMap.get(email);
        if (existingEnrollment != null) {
          // Skip if already joined
          if (existingEnrollment.getStatus() == OrgEnrollStatus.JOINED) {
            skippedEmails.add(email);
            log.info("Skipped email (already joined): {}", email);
            continue;
          }

          // Skip if pending invite and NOT expired
          if (existingEnrollment.getStatus() == OrgEnrollStatus.PENDING_INVITE) {
            boolean isExpired = existingEnrollment.getExpiry() != null 
                && Instant.now().isAfter(existingEnrollment.getExpiry());
            
            if (!isExpired) {
              skippedEmails.add(email);
              log.info("Skipped email (already invited, not expired): {}", email);
              continue;
            }
            
            // Re-invite expired pending invite
            Instant newExpiry = LocalDate.now(zone)
                .plusDays(8)
                .atStartOfDay(zone)
                .toInstant();
            existingEnrollment.setExpiry(newExpiry);
            orgEnrollmentRepository.save(existingEnrollment);

            // Send appropriate notification/email
            if (existingEnrollment.getMember() != null) {
              notificationService.createNotification(
                  existingEnrollment.getMember().getId(),
                  NotificationType.INFO,
                  "Organization invitation",
                  "You have a new invitation from " + organization.getName());
              sendInvitationEmail(existingEnrollment, organization);
            } else {
              emailService.sendAccountCreationInvitation(email, organization.getName());
            }

            successEmails.add(email);
            log.info("Re-invited expired pending member: {}", email);
            continue;
          }

          // If removed, re-invite, reset expiry
          if (existingEnrollment.getStatus() == OrgEnrollStatus.REMOVED) {
            existingEnrollment.setStatus(OrgEnrollStatus.PENDING_INVITE);
            Instant expiry = LocalDate.now(zone)
                .plusDays(8)
                .atStartOfDay(zone)
                .toInstant();
            existingEnrollment.setExpiry(expiry);
            orgEnrollmentRepository.save(existingEnrollment);

            // Send appropriate notification/email
            if (existingEnrollment.getMember() != null) {
              notificationService.createNotification(
                  existingEnrollment.getMember().getId(),
                  NotificationType.INFO,
                  "Organization invitation",
                  "You have a new invitation from " + organization.getName());
              sendInvitationEmail(existingEnrollment, organization);
            } else {
              emailService.sendAccountCreationInvitation(email, organization.getName());
            }

            successEmails.add(email);
            log.info("Re-invited removed member: {}", email);
            continue;
          }
        }

        // User exists in the system
        if (usersMap.containsKey(email)) {
          User user = usersMap.get(email);

          // Validate user role is READER
          if (user.getRole() != UserRole.READER) {
            failedInvitations.add(FailedInvitation.builder()
                .email(email)
                .reason("Only readers can be invited to organizations")
                .build());
            log.warn("Cannot invite non-reader user: {}", email);
            continue;
          }

          // Validate user status is ACTIVE
          if (user.getStatus() != UserStatus.ACTIVE) {
            failedInvitations.add(FailedInvitation.builder()
                .email(email)
                .reason("User account is not active")
                .build());
            log.warn("Cannot invite inactive user: {}", email);
            continue;
          }

          // Send notification
          notificationService.createNotification(
              user.getId(),
              NotificationType.INFO,
              "Organization invitation",
              "You have a new invitation from " + organization.getName());

          // Create enrollment with expiry
          Instant expiry = LocalDate.now(zone)
              .plusDays(8)
              .atStartOfDay(zone)
              .toInstant();

          OrgEnrollment enrollment = OrgEnrollment.builder()
              .organization(organization)
              .member(user)
              .memberEmail(email)
              .status(OrgEnrollStatus.PENDING_INVITE)
              .importBatch(batch)
              .expiry(expiry)
              .build();

          orgEnrollmentRepository.save(enrollment);

          // Send invitation email
          sendInvitationEmail(enrollment, organization);

          successEmails.add(email);
          log.info("Successfully invited existing user: {}", email);

        } else {
          // User does NOT exist - send email to create account
          emailService.sendAccountCreationInvitation(email, organization.getName());

          // Still create enrollment record to track the invitation
          Instant expiry = LocalDate.now(zone)
              .plusDays(8)
              .atStartOfDay(zone)
              .toInstant();

          OrgEnrollment enrollment = OrgEnrollment.builder()
              .organization(organization)
              .member(null)  // No user yet
              .memberEmail(email)
              .status(OrgEnrollStatus.PENDING_INVITE)
              .importBatch(batch)
              .expiry(expiry)
              .build();

          orgEnrollmentRepository.save(enrollment);

          successEmails.add(email);
          log.info("Sent account creation invitation to non-existing user: {}", email);
        }

      } catch (Exception e) {
        log.error("Error processing invitation for email: {}", email, e);
        failedInvitations.add(FailedInvitation.builder()
            .email(email)
            .reason(e.getMessage() != null ? e.getMessage() : "Internal error")
            .build());
      }
    }

    // Save import result items to database
    List<ImportResultItem> resultItems = new ArrayList<>();
    
    for (String email : successEmails) {
      resultItems.add(ImportResultItem.builder()
          .importBatch(batch)
          .email(email)
          .status("SUCCESS")
          .reason(null)
          .build());
    }
    
    for (FailedInvitation failed : failedInvitations) {
      resultItems.add(ImportResultItem.builder()
          .importBatch(batch)
          .email(failed.getEmail())
          .status("FAILED")
          .reason(failed.getReason())
          .build());
    }
    
    for (String email : skippedEmails) {
      resultItems.add(ImportResultItem.builder()
          .importBatch(batch)
          .email(email)
          .status("SKIPPED")
          .reason("Already invited or joined")
          .build());
    }
    
    importResultItemRepository.saveAll(resultItems);

    return InviteMembersResponse.builder()
        .importBatchId(batch.getId())
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
      // Generate JWT token for invitation
      String invitationToken = jwtUtil.generateOrgInvitationToken(
          enrollment.getId(),
          enrollment.getMemberEmail(),
          organization.getId()
      );

      // Send email with JWT token
      emailService.sendOrganizationInvitationWithToken(
          enrollment.getMemberEmail(),
          enrollment.getMember().getFullName(),
          organization.getName(),
          invitationToken
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

    // Validate enrollment belongs to reader (by email or by member)
    boolean belongsToReader = false;
    if (enrollment.getMember() != null && enrollment.getMember().getId().equals(readerId)) {
      belongsToReader = true;
    } else if (enrollment.getMemberEmail().equalsIgnoreCase(reader.getEmail())) {
      // Link enrollment to reader if member is null
      enrollment.setMember(reader);
      belongsToReader = true;
    }

    if (!belongsToReader) {
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
  public void acceptInvitationByToken(String token, UUID userId) {
    log.info("User {} accepting invitation by token", userId);

    // Validate JWT token
    if (!jwtUtil.validateToken(token)) {
      throw new InvalidRequestException("Invalid or expired invitation token");
    }

    // Verify token type
    String tokenType = jwtUtil.getTokenType(token);
    if (!"org_invitation".equals(tokenType)) {
      throw new InvalidRequestException("Invalid token type");
    }

    // Extract information from token
    UUID enrollmentId = jwtUtil.getEnrollmentIdFromToken(token);
    String tokenEmail = jwtUtil.getEmailFromToken(token);
    UUID tokenOrganizationId = jwtUtil.getOrganizationIdFromToken(token);

    // Get user
    User user = getUserById(userId);

    // Validate user email matches token email
    if (!user.getEmail().equalsIgnoreCase(tokenEmail)) {
      throw new BusinessException(
          "Token email does not match user email",
          HttpStatus.FORBIDDEN,
          "EMAIL_MISMATCH"
      );
    }

    // Validate user is READER
    validateUserIsReader(user);

    // Get enrollment
    OrgEnrollment enrollment = getEnrollmentById(enrollmentId);

    // Validate enrollment belongs to correct organization
    if (!enrollment.getOrganization().getId().equals(tokenOrganizationId)) {
      throw new BusinessException(
          "Token organization does not match enrollment organization",
          HttpStatus.FORBIDDEN,
          "ORGANIZATION_MISMATCH"
      );
    }

    // Validate enrollment email matches token email
    if (!enrollment.getMemberEmail().equalsIgnoreCase(tokenEmail)) {
      throw new BusinessException(
          "Token email does not match enrollment email",
          HttpStatus.FORBIDDEN,
          "ENROLLMENT_EMAIL_MISMATCH"
      );
    }

    // Validate enrollment status
    if (enrollment.getStatus() != OrgEnrollStatus.PENDING_INVITE) {
      throw new InvalidRequestException("Enrollment is not in pending status");
    }

    // Check if invitation has expired
    if (enrollment.getExpiry() != null && Instant.now().isAfter(enrollment.getExpiry())) {
      throw new BusinessException(
          "Invitation has expired",
          HttpStatus.BAD_REQUEST,
          "INVITATION_EXPIRED"
      );
    }

    // Link enrollment to user if member is null
    if (enrollment.getMember() == null) {
      enrollment.setMember(user);
    }

    // Accept invitation
    enrollment.acceptInvitation();
    orgEnrollmentRepository.save(enrollment);

    // Send notification to organization admin
    notificationService.createNotification(
        enrollment.getOrganization().getAdmin().getId(),
        NotificationType.INFO,
        "New member joined",
        String.format("%s has joined your organization %s",
            user.getFullName(),
            enrollment.getOrganization().getName())
    );

    log.info("User {} successfully joined organization {} via token",
        userId, enrollment.getOrganization().getName());
  }

  @Override
  @Transactional
  public void rejectInvitation(UUID readerId, UUID enrollmentId) {
    log.info("Reader {} rejecting invitation {}", readerId, enrollmentId);

    User reader = getUserById(readerId);
    validateUserIsReader(reader);

    OrgEnrollment enrollment = getEnrollmentById(enrollmentId);

    // Validate enrollment belongs to reader (by email or by member)
    boolean belongsToReader = false;
    if (enrollment.getMember() != null && enrollment.getMember().getId().equals(readerId)) {
      belongsToReader = true;
    } else if (enrollment.getMemberEmail().equalsIgnoreCase(reader.getEmail())) {
      // Link enrollment to reader if member is null (before rejecting)
      enrollment.setMember(reader);
      belongsToReader = true;
    }

    if (!belongsToReader) {
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

    // Remove member (Soft delete)
    enrollment.removeMember();
    orgEnrollmentRepository.save(enrollment);

    log.info("Organization admin {} successfully removed member {}", organizationAdminId,
        enrollment.getMember().getEmail());
  }

  @Override
  @Transactional
  public void leaveOrganization(UUID readerId, UUID organizationId) {
    log.info("Reader {} leaving organization {}", readerId, organizationId);

    User reader = getUserById(readerId);
    validateUserIsReader(reader);

    // Find the enrollment by reader and organization
    OrgEnrollment enrollment = orgEnrollmentRepository
        .findByMemberIdAndOrganizationId(readerId, organizationId)
        .orElseThrow(() -> new ResourceNotFoundException(
            "Enrollment not found for this reader and organization"));

    // Validate enrollment is currently joined
    if (enrollment.getStatus() != OrgEnrollStatus.JOINED) {
      throw new BusinessException(
          "Cannot leave organization - enrollment is not joined",
          HttpStatus.BAD_REQUEST,
          "ENROLLMENT_NOT_JOINED"
      );
    }

    // Remove member (Soft delete) - same behavior as admin removing member
    enrollment.removeMember();
    orgEnrollmentRepository.save(enrollment);

    log.info("Reader {} successfully left organization {}", readerId,
        enrollment.getOrganization().getName());
  }

  @Override
  @Transactional(readOnly = true)
  public OrgEnrollmentResponse getEnrollmentDetail(UUID enrollmentId) {
    log.info("Get enrollment detail: {}", enrollmentId);

    OrgEnrollment enrollment = getEnrollmentById(enrollmentId);
    return buildEnrollmentResponse(enrollment);
  }

  @Override
  @Transactional
  public OrgEnrollmentResponse updateEnrollmentStatus(
      UUID organizationAdminId,
      UUID enrollmentId,
      OrgEnrollStatus newStatus) {
    log.info("Organization admin {} updating enrollment {} status to {}",
        organizationAdminId, enrollmentId, newStatus);

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

    OrgEnrollStatus currentStatus = enrollment.getStatus();

    // Validate status transition
    if (!isValidStatusTransition(currentStatus, newStatus)) {
      throw new InvalidRequestException(
          String.format("Cannot transition from %s to %s", currentStatus, newStatus)
      );
    }

    // Update status based on transition
    if (newStatus == OrgEnrollStatus.JOINED) {
      enrollment.acceptInvitation();
    } else if (newStatus == OrgEnrollStatus.REMOVED) {
      enrollment.removeMember();
    } else if (newStatus == OrgEnrollStatus.PENDING_INVITE) {
      enrollment.setStatus(OrgEnrollStatus.PENDING_INVITE);
    }

    enrollment = orgEnrollmentRepository.save(enrollment);
    log.info("Successfully updated enrollment {} status to {}", enrollmentId, newStatus);

    return buildEnrollmentResponse(enrollment);
  }

  private boolean isValidStatusTransition(OrgEnrollStatus currentStatus, OrgEnrollStatus newStatus) {
    // Same status is not allowed
    if (currentStatus == newStatus) {
      return false;
    }

    // Valid transitions:
    // PENDING_INVITE -> JOINED or REMOVED
    // JOINED -> REMOVED or PENDING_INVITE
    // REMOVED -> JOINED (reactivate member)
    if (currentStatus == OrgEnrollStatus.REMOVED) {
      return newStatus == OrgEnrollStatus.JOINED;
    }

    return true;
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
    OrgEnrollmentResponse res = orgEnrollmentMapper.toResponse(enrollment);
    res.setOrganizationType(enrollment.getOrganization().getType().getDisplayName());
    return res;
  }

  @Override
  @Transactional(readOnly = true)
  public Page<MemberImportBatchResponse> getImportBatches(
      UUID organizationAdminId,
      String search,
      Pageable pageable) {
    log.info("Get import batches for organization admin: {}, search: {}", organizationAdminId, search);

    OrganizationProfile organization = getOrganizationByAdminId(organizationAdminId);

    Page<MemberImportBatch> batchPage;
    if (search != null && !search.trim().isEmpty()) {
      batchPage = memberImportBatchRepository
          .findByOrganizationAndFileNameContainingIgnoreCaseOrderByCreatedAtDesc(
              organization, search.trim(), pageable);
    } else {
      batchPage = memberImportBatchRepository
          .findByOrganizationOrderByCreatedAtDesc(organization, pageable);
    }

    return batchPage.map(memberImportBatchMapper::toResponse);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<OrgEnrollmentResponse> getImportBatchEnrollments(
      UUID organizationAdminId,
      UUID importBatchId,
      Pageable pageable) {
    log.info("Get enrollments for import batch: {}", importBatchId);

    // Verify organization ownership
    OrganizationProfile organization = getOrganizationByAdminId(organizationAdminId);

    MemberImportBatch batch = memberImportBatchRepository.findById(importBatchId)
        .orElseThrow(() -> new ResourceNotFoundException(
            "Import batch", "id", importBatchId));

    // Verify batch belongs to the organization
    if (!batch.getOrganization().getId().equals(organization.getId())) {
      throw new BusinessException(
          "Import batch does not belong to this organization",
          HttpStatus.FORBIDDEN,
          "IMPORT_BATCH_FORBIDDEN"
      );
    }

    // Find all enrollments created from this batch
    Page<OrgEnrollment> enrollments = orgEnrollmentRepository
        .findAll(OrgEnrollmentSpecification.hasImportBatch(batch), pageable);

    return enrollments.map(this::buildEnrollmentResponse);
  }

  private MemberImportBatch createImportBatch(
      OrganizationProfile organization,
      User admin,
      String importSource,
      int totalEmails,
      MultipartFile file) {

    // Upload Excel file to S3 if provided
    String importFileKey = null;
    if (file != null && !file.isEmpty()) {
      try {
        importFileKey = fileStorageService.uploadFile(file, FileStorage.MEMBER_IMPORT_FOLDER, null);
        log.info("Uploaded import Excel file to S3: {}", importFileKey);
      } catch (Exception e) {
        log.error("Failed to upload Excel file to S3", e);
        // Continue without file URL
      }
    }

    // Get original file name
    String originalFileName = null;
    if (file != null && !file.isEmpty()) {
      originalFileName = file.getOriginalFilename();
    }

    // Create and save import batch with initial counts
    MemberImportBatch batch = MemberImportBatch.builder()
        .organization(organization)
        .admin(admin)
        .importSource(importSource)
        .totalEmails(totalEmails)
        .successCount(0)
        .failedCount(0)
        .skippedCount(0)
        .fileKey(importFileKey)
        .fileName(originalFileName)
        .build();

    batch = memberImportBatchRepository.save(batch);

    log.info("Created import batch for organization: {}, source: {}",
        organization.getName(), importSource);

    return batch;
  }

  @Override
  @Transactional(readOnly = true)
  public Page<ImportResultItemResponse> getImportResultItems(
      UUID organizationAdminId,
      UUID importBatchId,
      Pageable pageable) {
    log.info("Get import result items for batch: {}", importBatchId);

    // Verify organization ownership
    OrganizationProfile organization = getOrganizationByAdminId(organizationAdminId);

    MemberImportBatch batch = memberImportBatchRepository.findById(importBatchId)
        .orElseThrow(() -> new ResourceNotFoundException(
            "Import batch", "id", importBatchId));

    // Verify batch belongs to the organization
    if (!batch.getOrganization().getId().equals(organization.getId())) {
      throw new BusinessException(
          "Import batch does not belong to this organization",
          HttpStatus.FORBIDDEN,
          "IMPORT_BATCH_FORBIDDEN"
      );
    }

    // Find all import result items for this batch (ordered by status: FAILED, SKIPPED, SUCCESS)
    Page<ImportResultItem> items = importResultItemRepository.findByImportBatchOrderByStatusAsc(batch, pageable);

    return items.map(item -> ImportResultItemResponse.builder()
        .id(item.getId())
        .email(item.getEmail())
        .status(item.getStatus())
        .reason(item.getReason())
        .createdAt(item.getCreatedAt())
        .build());
  }
}
