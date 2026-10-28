package com.capstone.be.service.impl;

import com.capstone.be.config.constant.FileStorage;
import com.capstone.be.domain.entity.EmailChangeRequest;
import com.capstone.be.domain.entity.PasswordResetRequest;
import com.capstone.be.domain.entity.PasswordResetToken;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.EmailChangeStatus;
import com.capstone.be.domain.enums.PasswordResetStatus;
import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.domain.enums.UserStatus;
import com.capstone.be.dto.request.admin.ChangeRoleRequest;
import com.capstone.be.dto.request.admin.UpdateUserStatusRequest;
import com.capstone.be.dto.request.user.ChangeEmailRequest;
import com.capstone.be.dto.request.user.ChangePasswordRequest;
import com.capstone.be.dto.response.admin.AdminOrganizationResponse;
import com.capstone.be.dto.response.admin.AdminReaderResponse;
import com.capstone.be.dto.response.admin.AdminReviewerResponse;
import com.capstone.be.dto.response.admin.UserManagementResponse;
import com.capstone.be.exception.BusinessException;
import com.capstone.be.exception.DuplicateResourceException;
import com.capstone.be.exception.InvalidRequestException;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.exception.UnauthorizedException;
import com.capstone.be.domain.entity.OrgEnrollment;
import com.capstone.be.domain.entity.OrganizationProfile;
import com.capstone.be.domain.enums.OrgEnrollStatus;
import com.capstone.be.repository.EmailChangeRequestRepository;
import com.capstone.be.repository.OrgEnrollmentRepository;
import com.capstone.be.repository.OrganizationProfileRepository;
import com.capstone.be.repository.PasswordResetRequestRepository;
import com.capstone.be.repository.PasswordResetTokenRepository;
import com.capstone.be.repository.ReaderProfileRepository;
import com.capstone.be.repository.ReviewerProfileRepository;
import com.capstone.be.repository.ReviewerDomainLinkRepository;
import com.capstone.be.repository.ReviewerSpecLinkRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.repository.specification.UserSpecification;
import com.capstone.be.service.EmailService;
import com.capstone.be.service.FileStorageService;
import com.capstone.be.service.UserService;
import com.capstone.be.service.helper.NotificationHelper;
import com.capstone.be.util.OtpUtil;
import com.capstone.be.util.TokenUtil;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.capstone.be.event.OrganizationStatusChangedEvent;
import com.capstone.be.event.UserRoleChangedEvent;
import com.capstone.be.event.UserStatusChangedEvent;
import com.capstone.be.service.AdminUserService;


/**
 * Thân các phương thức chuyển NGUYÊN VĂN từ UserServiceImpl, không đổi logic.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AdminUserServiceImpl implements AdminUserService {

  private final UserRepository userRepository;
  private final ReaderProfileRepository readerProfileRepository;
  private final ReviewerProfileRepository reviewerProfileRepository;
  private final ReviewerDomainLinkRepository reviewerDomainLinkRepository;
  private final ReviewerSpecLinkRepository reviewerSpecLinkRepository;
  private final OrganizationProfileRepository organizationProfileRepository;
  private final ApplicationEventPublisher events;


  @Override
  @Transactional(readOnly = true)
  public Page<AdminReaderResponse> getAllReaders(
      UserStatus status, String search, Pageable pageable) {
    log.info("Admin getting all readers - status: {}, search: {}", status, search);

    Specification<User> spec = Specification
        .where(UserSpecification.hasRole(UserRole.READER))
        // Only filter by status when explicitly provided; otherwise include all statuses
        .and(status != null ? UserSpecification.hasStatus(status) : null)
        .and(UserSpecification.searchByKeyword(search));
    Page<User> users = userRepository.findAll(spec, pageable);

    return users.map(this::buildAdminReaderResponse);
  }

  @Override
  @Transactional(readOnly = true)
  public AdminReaderResponse getReaderDetail(UUID userId) {
    log.info("Admin getting reader detail for ID: {}", userId);

    User user = userRepository.findById(userId)
        .orElseThrow(() -> new BusinessException(
            "User not found with id: " + userId,
            HttpStatus.NOT_FOUND,
            "USER_NOT_FOUND"
        ));

    if (user.getRole() != UserRole.READER) {
      throw new BusinessException(
          "User is not a reader",
          HttpStatus.BAD_REQUEST,
          "INVALID_USER_ROLE"
      );
    }

    return buildAdminReaderResponse(user);
  }

  @Override
  @Transactional
  public AdminReaderResponse updateReaderStatus(
      UUID userId, UpdateUserStatusRequest request) {
    log.info("Admin updating reader status for ID: {} to {}, reason: {}",
        userId, request.getStatus(), request.getReason());

    User user = userRepository.findById(userId)
        .orElseThrow(() -> new BusinessException(
            "User not found with id: " + userId,
            HttpStatus.NOT_FOUND,
            "USER_NOT_FOUND"
        ));

    if (user.getRole() != UserRole.READER) {
      throw new BusinessException(
          "User is not a reader",
          HttpStatus.BAD_REQUEST,
          "INVALID_USER_ROLE"
      );
    }

    user.setStatus(request.getStatus());
    userRepository.save(user);

    log.info("Reader status updated successfully for user: {} - reason: {}", userId,
        request.getReason());

    // Email gửi SAU KHI transaction commit — xem UserNotificationListener
    events.publishEvent(new UserStatusChangedEvent(
        userId, user.getEmail(), user.getFullName(),
        request.getStatus(), request.getReason()));

    return buildAdminReaderResponse(user);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<AdminReviewerResponse> getAllReviewers(
      UserStatus status, String search, Pageable pageable) {
    log.info("Admin getting all reviewers - status: {}, search: {}", status, search);

    Specification<User> spec = Specification
        .where(UserSpecification.hasRole(UserRole.REVIEWER))
        // Only filter by status when explicitly provided; otherwise include all statuses
        .and(status != null ? UserSpecification.hasStatus(status) : null)
        .and(UserSpecification.searchByKeyword(search));
    Page<User> users = userRepository.findAll(spec, pageable);

    return users.map(this::buildAdminReviewerResponse);
  }

  @Override
  @Transactional(readOnly = true)
  public AdminReviewerResponse getReviewerDetail(UUID userId) {
    log.info("Admin getting reviewer detail for ID: {}", userId);

    User user = userRepository.findById(userId)
        .orElseThrow(() -> new BusinessException(
            "User not found with id: " + userId,
            HttpStatus.NOT_FOUND,
            "USER_NOT_FOUND"
        ));

    if (user.getRole() != UserRole.REVIEWER) {
      throw new BusinessException(
          "User is not a reviewer",
          HttpStatus.BAD_REQUEST,
          "INVALID_USER_ROLE"
      );
    }

    return buildAdminReviewerResponse(user);
  }

  @Override
  @Transactional
  public AdminReviewerResponse updateReviewerStatus(
      UUID userId, UpdateUserStatusRequest request) {
    log.info("Admin updating reviewer status for ID: {} to {}, reason: {}",
        userId, request.getStatus(), request.getReason());

    User user = userRepository.findById(userId)
        .orElseThrow(() -> new BusinessException(
            "User not found with id: " + userId,
            HttpStatus.NOT_FOUND,
            "USER_NOT_FOUND"
        ));

    if (user.getRole() != UserRole.REVIEWER) {
      throw new BusinessException(
          "User is not a reviewer",
          HttpStatus.BAD_REQUEST,
          "INVALID_USER_ROLE"
      );
    }

    user.setStatus(request.getStatus());
    userRepository.save(user);

    log.info("Reviewer status updated successfully for user: {} - reason: {}", userId,
        request.getReason());

    // Email gửi SAU KHI transaction commit — xem UserNotificationListener
    events.publishEvent(new UserStatusChangedEvent(
        userId, user.getEmail(), user.getFullName(),
        request.getStatus(), request.getReason()));

    return buildAdminReviewerResponse(user);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<AdminOrganizationResponse> getAllOrganizations(
      UserStatus status, String search, Pageable pageable) {
    log.info("Admin getting all organizations - status: {}, search: {}", status, search);

    // Use searchOrganizationsByKeyword for organizations to search in multiple fields
    Specification<User> spec = Specification
        .where(UserSpecification.hasRole(UserRole.ORGANIZATION_ADMIN))
        // Only filter by status when explicitly provided; otherwise include all statuses
        .and(status != null ? UserSpecification.hasStatus(status) : null)
        .and(UserSpecification.searchOrganizationsByKeyword(search));
    
    Page<User> users = userRepository.findAll(spec, pageable);

    return users.map(this::buildAdminOrganizationResponse);
  }

  @Override
  @Transactional(readOnly = true)
  public AdminOrganizationResponse getOrganizationDetail(
      UUID userId) {
    log.info("Admin getting organization detail for ID: {}", userId);

    User user = userRepository.findById(userId)
        .orElseThrow(() -> new BusinessException(
            "User not found with id: " + userId,
            HttpStatus.NOT_FOUND,
            "USER_NOT_FOUND"
        ));

    if (user.getRole() != UserRole.ORGANIZATION_ADMIN) {
      throw new BusinessException(
          "User is not an organization admin",
          HttpStatus.BAD_REQUEST,
          "INVALID_USER_ROLE"
      );
    }

    return buildAdminOrganizationResponse(user);
  }

  @Override
  @Transactional
  public AdminOrganizationResponse updateOrganizationStatus(
      UUID userId, UpdateUserStatusRequest request) {
    log.info("Admin updating organization status for ID: {} to {}, reason: {}",
        userId, request.getStatus(), request.getReason());

    User user = userRepository.findById(userId)
        .orElseThrow(() -> new BusinessException(
            "User not found with id: " + userId,
            HttpStatus.NOT_FOUND,
            "USER_NOT_FOUND"
        ));

    if (user.getRole() != UserRole.ORGANIZATION_ADMIN) {
      throw new BusinessException(
          "User is not an organization admin",
          HttpStatus.BAD_REQUEST,
          "INVALID_USER_ROLE"
      );
    }

    user.setStatus(request.getStatus());
    userRepository.save(user);

    log.info("Organization status updated successfully for user: {} - reason: {}", userId,
        request.getReason());

    // Email cho admin tổ chức VÀ fan-out cho mọi thành viên, gửi SAU KHI transaction
    // commit — xem UserNotificationListener. Trước đây vòng lặp phân trang gửi hàng
    // trăm email chạy ngay trong transaction ghi này.
    events.publishEvent(new OrganizationStatusChangedEvent(
        userId, user.getEmail(), user.getFullName(),
        request.getStatus(), request.getReason()));

    return buildAdminOrganizationResponse(user);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<UserManagementResponse> getAllUsersForRoleManagement(
      String search, UserRole role, UserStatus status,
      Instant dateFrom, Instant dateTo,
      Pageable pageable) {
    log.info("System admin getting all users for role management - search: {}, role: {}, status: {}, dateFrom: {}, dateTo: {}",
        search, role, status, dateFrom, dateTo);

    Specification<User> spec = UserSpecification
        .withFilters(role, status, search, dateFrom, dateTo);

    Page<User> users = userRepository.findAll(spec, pageable);

    return users.map(this::buildUserManagementResponse);
  }

  @Override
  @Transactional
  public UserManagementResponse changeUserRole(
      UUID userId, ChangeRoleRequest request, UUID changedBy) {
    log.info("System admin {} changing role for user {} from {} to {}, reason: {}",
        changedBy, userId, "current", request.getRole(), request.getReason());

    // Prevent user from changing their own role
    if (userId.equals(changedBy)) {
      throw new BusinessException(
          "You cannot change your own role",
          HttpStatus.BAD_REQUEST,
          "CANNOT_CHANGE_OWN_ROLE"
      );
    }

    User user = userRepository.findById(userId)
        .orElseThrow(() -> new BusinessException(
            "User not found with id: " + userId,
            HttpStatus.NOT_FOUND,
            "USER_NOT_FOUND"
        ));

    UserRole oldRole = user.getRole();

    // Validate that role is actually changing
    if (oldRole == request.getRole()) {
      throw new BusinessException(
          "User already has the role: " + request.getRole(),
          HttpStatus.BAD_REQUEST,
          "SAME_ROLE"
      );
    }

    // Update role
    user.setRole(request.getRole());
    userRepository.save(user);

    log.info("User role changed successfully - user: {}, oldRole: {}, newRole: {}, changedBy: {}, reason: {}",
        userId, oldRole, request.getRole(), changedBy, request.getReason());

    // Email gửi SAU KHI transaction commit — xem UserNotificationListener
    events.publishEvent(new UserRoleChangedEvent(
        userId, user.getEmail(), user.getFullName(),
        oldRole, request.getRole(), request.getReason()));

    // TODO: Add audit logging here when audit log service is available
    // auditLogService.logRoleChange(userId, oldRole, request.getRole(), changedBy, request.getReason());

    return buildUserManagementResponse(user);
  }

  private AdminReaderResponse buildAdminReaderResponse(
      User user) {
    AdminReaderResponse.AdminReaderResponseBuilder builder =
        AdminReaderResponse.builder()
            .userId(user.getId())
            .email(user.getEmail())
            .fullName(user.getFullName())
            .avatarUrl(user.getAvatarKey())
//            .point(user.getPoint())
            .status(user.getStatus())
            .createdAt(user.getCreatedAt())
            .updatedAt(user.getUpdatedAt());

    readerProfileRepository.findByUserId(user.getId()).ifPresent(profile -> {
      builder.dob(profile.getDob());
    });

    return builder.build();
  }

  private AdminReviewerResponse buildAdminReviewerResponse(
      User user) {
    AdminReviewerResponse.AdminReviewerResponseBuilder builder =
        AdminReviewerResponse.builder()
            .userId(user.getId())
            .email(user.getEmail())
            .fullName(user.getFullName())
            .avatarUrl(user.getAvatarKey())
//            .point(user.getPoint())
            .status(user.getStatus())
            .createdAt(user.getCreatedAt())
            .updatedAt(user.getUpdatedAt());

    reviewerProfileRepository.findByUserId(user.getId()).ifPresent(profile -> {
      // Force initialize lazy collection
      profile.getCredentialFileUrls().size();

      // Get domains
      List<com.capstone.be.domain.entity.Domain> domains = reviewerDomainLinkRepository
          .findByReviewerId(profile.getId())
          .stream()
          .map(link -> link.getDomain())
          .toList();

      // Get specializations
      List<com.capstone.be.domain.entity.Specialization> specializations = reviewerSpecLinkRepository
          .findByReviewerId(profile.getId())
          .stream()
          .map(link -> link.getSpecialization())
          .toList();

      // Map domains to DomainInfo
      List<AdminReviewerResponse.DomainInfo> domainInfos = domains.stream()
          .map(domain -> AdminReviewerResponse.DomainInfo.builder()
              .id(domain.getId())
              .name(domain.getName())
              .build())
          .toList();

      // Map specializations to SpecializationInfo
      List<AdminReviewerResponse.SpecializationInfo> specializationInfos = specializations.stream()
          .map(spec -> AdminReviewerResponse.SpecializationInfo.builder()
              .id(spec.getId())
              .name(spec.getName())
              .domainId(spec.getDomain() != null ? spec.getDomain().getId() : null)
              .domainName(spec.getDomain() != null ? spec.getDomain().getName() : null)
              .build())
          .toList();

      builder
          .dateOfBirth(profile.getDateOfBirth())
          .ordid(profile.getOrdid())
          .educationLevel(profile.getEducationLevel())
          .organizationName(profile.getOrganizationName())
          .organizationEmail(profile.getOrganizationEmail())
          .credentialFileUrls(profile.getCredentialFileUrls())
          .domains(domainInfos)
          .specializations(specializationInfos);
    });

    return builder.build();
  }

  private AdminOrganizationResponse buildAdminOrganizationResponse(
      User user) {
    AdminOrganizationResponse.AdminOrganizationResponseBuilder builder =
        AdminOrganizationResponse.builder()
            .userId(user.getId())
            .email(user.getEmail())
            .fullName(user.getFullName())
            .avatarUrl(user.getAvatarKey())
//            .point(user.getPoint())
            .status(user.getStatus())
            .createdAt(user.getCreatedAt())
            .updatedAt(user.getUpdatedAt());

    organizationProfileRepository.findByUserId(user.getId()).ifPresent(profile -> {
      builder
          .organizationId(profile.getId()) // Add organizationId
          .orgName(profile.getName())
          .orgType(profile.getType() != null ? profile.getType().name() : null)
          .orgEmail(profile.getEmail())
          .orgHotline(profile.getHotline())
          .orgLogo(profile.getLogoKey())
          .orgAddress(profile.getAddress())
          .orgRegistrationNumber(profile.getRegistrationNumber());
    });

    return builder.build();
  }

  private UserManagementResponse buildUserManagementResponse(User user) {
    return UserManagementResponse.builder()
        .id(user.getId())
        .email(user.getEmail())
        .fullName(user.getFullName())
        .avatarUrl(user.getAvatarKey())
        .role(user.getRole())
        .status(user.getStatus())
        .createdAt(user.getCreatedAt())
        .updatedAt(user.getUpdatedAt())
        .build();
  }
}
