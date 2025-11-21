package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.EmailChangeRequest;
import com.capstone.be.domain.entity.PasswordResetRequest;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.EmailChangeStatus;
import com.capstone.be.domain.enums.PasswordResetStatus;
import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.domain.enums.UserStatus;
import com.capstone.be.dto.request.admin.UpdateUserStatusRequest;
import com.capstone.be.dto.request.user.ChangeEmailRequest;
import com.capstone.be.dto.request.user.ChangePasswordRequest;
import com.capstone.be.dto.response.admin.AdminOrganizationResponse;
import com.capstone.be.dto.response.admin.AdminReaderResponse;
import com.capstone.be.dto.response.admin.AdminReviewerResponse;
import com.capstone.be.exception.BusinessException;
import com.capstone.be.exception.DuplicateResourceException;
import com.capstone.be.exception.InvalidRequestException;
import com.capstone.be.repository.EmailChangeRequestRepository;
import com.capstone.be.repository.OrganizationProfileRepository;
import com.capstone.be.repository.PasswordResetRequestRepository;
import com.capstone.be.repository.ReaderProfileRepository;
import com.capstone.be.repository.ReviewerProfileRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.repository.specification.UserSpecification;
import com.capstone.be.service.EmailService;
import com.capstone.be.service.UserService;
import com.capstone.be.util.OtpUtil;
import java.time.LocalDateTime;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final ReaderProfileRepository readerProfileRepository;
  private final ReviewerProfileRepository reviewerProfileRepository;
  private final OrganizationProfileRepository organizationProfileRepository;
  private final EmailService emailService;
  private final EmailChangeRequestRepository emailChangeRequestRepository;
  private final PasswordResetRequestRepository passwordResetRequestRepository;

  @Override
  @Transactional
  public void changePassword(UUID userId, ChangePasswordRequest request) {
    // Validate password confirmation
    if (!request.getNewPassword().equals(request.getConfirmPassword())) {
      throw new BusinessException(
          "New password and confirmation password do not match",
          HttpStatus.BAD_REQUEST,
          "PASSWORD_MISMATCH"
      );
    }

    // Find user
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new BusinessException(
            "User not found with id: " + userId,
            HttpStatus.NOT_FOUND,
            "USER_NOT_FOUND"
        ));

    // Verify current password
    if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
      throw new BusinessException(
          "Current password is incorrect",
          HttpStatus.BAD_REQUEST,
          "INVALID_CURRENT_PASSWORD"
      );
    }

    // Check if new password is same as current password
    if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
      throw new BusinessException(
          "New password must be different from current password",
          HttpStatus.BAD_REQUEST,
          "SAME_PASSWORD"
      );
    }

    // Update password
    user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
    userRepository.save(user);

    log.info("Password changed successfully for user: {}", userId);
  }

  @Override
  @Transactional
  public void deleteAccount(UUID userId) {
    log.info("Deleting account for user ID: {}", userId);

    // Find user
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new BusinessException(
            "User not found with id: " + userId,
            HttpStatus.NOT_FOUND,
            "USER_NOT_FOUND"
        ));

    // Check if already deleted
    if (user.getStatus() == UserStatus.DELETED) {
      throw new BusinessException(
          "Account is already deleted",
          HttpStatus.BAD_REQUEST,
          "ACCOUNT_ALREADY_DELETED"
      );
    }

    // Soft delete - set status to DELETED
    user.setStatus(UserStatus.DELETED);
    userRepository.save(user);

    log.info("Account deleted successfully for user: {}", userId);
  }

  @Override
  @Transactional
  public void requestEmailChange(UUID userId, ChangeEmailRequest request) {
    log.info("Request email change for user ID: {} to new email: {}", userId,
        request.getNewEmail());

    // Find user
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new BusinessException(
            "User not found with id: " + userId,
            HttpStatus.NOT_FOUND,
            "USER_NOT_FOUND"
        ));

    // Check if new email is same as current email
    if (user.getEmail().equalsIgnoreCase(request.getNewEmail())) {
      throw new InvalidRequestException("New email must be different from current email");
    }

    // Check if new email already exists
    if (userRepository.existsByEmail(request.getNewEmail())) {
      throw DuplicateResourceException.email(request.getNewEmail());
    }

    // Check if there's already a pending request for this new email
    emailChangeRequestRepository.findByNewEmailAndStatus(
        request.getNewEmail(),
        EmailChangeStatus.PENDING
    ).ifPresent(existing -> {
      throw new InvalidRequestException(
          "This email is already pending verification for another account");
    });

    // Cancel any existing pending request for this user
    emailChangeRequestRepository.findByUserAndStatus(
        user,
        EmailChangeStatus.PENDING
    ).ifPresent(existing -> {
      existing.setStatus(EmailChangeStatus.CANCELLED);
      emailChangeRequestRepository.save(existing);
    });

    // Generate OTP
    String otp = OtpUtil.generateOtp();
    String otpHash = passwordEncoder.encode(otp);
    LocalDateTime otpExpiry = LocalDateTime.now().plusMinutes(10);

    // Create new email change request
    EmailChangeRequest emailChangeRequest = EmailChangeRequest.builder()
        .user(user)
        .currentEmail(user.getEmail())
        .newEmail(request.getNewEmail())
        .otpHash(otpHash)
        .expiryTime(otpExpiry)
        .status(EmailChangeStatus.PENDING)
        .attemptCount(0)
        .build();

    emailChangeRequestRepository.save(emailChangeRequest);

    // Send OTP to current email
    emailService.sendEmailChangeOtp(userId, user.getEmail(), request.getNewEmail(), otp);

    log.info("Created email change request and sent OTP to current email for user: {}", userId);
  }

  @Override
  @Transactional
  public void verifyEmailChangeOtp(UUID userId, String otp) {
    log.info("Verify email change OTP for user ID: {}", userId);

    // Find user
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new BusinessException(
            "User not found with id: " + userId,
            HttpStatus.NOT_FOUND,
            "USER_NOT_FOUND"
        ));

    // Find pending email change request
    EmailChangeRequest emailChangeRequest = emailChangeRequestRepository.findByUserAndStatus(
        user,
        EmailChangeStatus.PENDING
    ).orElseThrow(() -> new InvalidRequestException("No pending email change request found"));

    // Check if request has expired
    if (emailChangeRequest.isExpired()) {
      emailChangeRequest.setStatus(EmailChangeStatus.EXPIRED);
      emailChangeRequestRepository.save(emailChangeRequest);
      throw new InvalidRequestException("OTP has expired. Please request a new email change");
    }

    // Check if max attempts reached
    if (emailChangeRequest.isMaxAttemptsReached()) {
      emailChangeRequest.setStatus(EmailChangeStatus.EXPIRED);
      emailChangeRequestRepository.save(emailChangeRequest);
      throw new InvalidRequestException(
          "Maximum verification attempts exceeded. Please request a new email change");
    }

    // Increment attempt count
    emailChangeRequest.incrementAttemptCount();

    // Verify OTP using password encoder (constant-time comparison)
    if (!passwordEncoder.matches(otp, emailChangeRequest.getOtpHash())) {
      emailChangeRequestRepository.save(emailChangeRequest);
      int remainingAttempts = 5 - emailChangeRequest.getAttemptCount();
      throw new InvalidRequestException(
          "Invalid OTP code. " + remainingAttempts + " attempts remaining");
    }

    // Check again if the new email is still available (double check)
    if (userRepository.existsByEmail(emailChangeRequest.getNewEmail())) {
      emailChangeRequest.setStatus(EmailChangeStatus.EXPIRED);
      emailChangeRequestRepository.save(emailChangeRequest);
      throw DuplicateResourceException.email(emailChangeRequest.getNewEmail());
    }

    // Update email
    String oldEmail = user.getEmail();
    user.setEmail(emailChangeRequest.getNewEmail());
    userRepository.save(user);

    // Mark request as verified
    emailChangeRequest.setStatus(EmailChangeStatus.VERIFIED);
    emailChangeRequestRepository.save(emailChangeRequest);

    log.info("Email changed successfully from {} to {} for user: {}", oldEmail, user.getEmail(),
        userId);
  }

  @Override
  @Transactional(noRollbackFor = InvalidRequestException.class)
  public void requestPasswordReset(String email) {
    log.info("Request password reset for email: {}", email);

    // Find user by email
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new BusinessException(
            "User not found with email: " + email,
            HttpStatus.NOT_FOUND,
            "USER_NOT_FOUND"
        ));

    // Check if user is active
    if (user.getStatus() != UserStatus.ACTIVE) {
      throw new InvalidRequestException("Account is not active. Cannot reset password");
    }

    // Cancel any existing pending request for this user
    passwordResetRequestRepository.findByUserAndStatus(
        user,
        PasswordResetStatus.PENDING
    ).ifPresent(existing -> {
      existing.setStatus(PasswordResetStatus.CANCELLED);
      passwordResetRequestRepository.save(existing);
    });

    // Generate OTP
    String otp = OtpUtil.generateOtp();
    String otpHash = passwordEncoder.encode(otp);
    LocalDateTime otpExpiry = LocalDateTime.now().plusMinutes(10);

    // Create new password reset request
    PasswordResetRequest passwordResetRequest = PasswordResetRequest.builder()
        .user(user)
        .email(user.getEmail())
        .otpHash(otpHash)
        .expiryTime(otpExpiry)
        .status(PasswordResetStatus.PENDING)
        .attemptCount(0)
        .build();

    passwordResetRequestRepository.save(passwordResetRequest);

    // Send OTP to user's email
    emailService.sendPasswordResetOtp(user.getEmail(), user.getFullName(), otp);

    log.info("Created password reset request and sent OTP to email: {}", email);
  }

  @Override
  @Transactional(noRollbackFor = InvalidRequestException.class)
  public void verifyPasswordResetOtp(String email, String otp, String newPassword) {
    log.info("Verify password reset OTP for email: {}", email);

    // Find user by email
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new BusinessException(
            "User not found with email: " + email,
            HttpStatus.NOT_FOUND,
            "USER_NOT_FOUND"
        ));

    // Find pending password reset request
    PasswordResetRequest passwordResetRequest = passwordResetRequestRepository.findByUserAndStatus(
        user,
        PasswordResetStatus.PENDING
    ).orElseThrow(() -> new InvalidRequestException("No pending password reset request found"));

    // Check if request has expired
    if (passwordResetRequest.isExpired()) {
      passwordResetRequest.setStatus(PasswordResetStatus.EXPIRED);
      passwordResetRequestRepository.save(passwordResetRequest);
      throw new InvalidRequestException("OTP has expired. Please request a new password reset");
    }

    // Check if max attempts reached
    if (passwordResetRequest.isMaxAttemptsReached()) {
      passwordResetRequest.setStatus(PasswordResetStatus.EXPIRED);
      passwordResetRequestRepository.save(passwordResetRequest);
      throw new InvalidRequestException(
          "Maximum verification attempts exceeded. Please request a new password reset");
    }

    // Increment attempt count
    passwordResetRequest.incrementAttemptCount();
    System.out.println(passwordResetRequest.getAttemptCount());

    // Verify OTP using password encoder (constant-time comparison)
    if (!passwordEncoder.matches(otp, passwordResetRequest.getOtpHash())) {
      passwordResetRequestRepository.save(passwordResetRequest);
      int remainingAttempts = 5 - passwordResetRequest.getAttemptCount();
      throw new InvalidRequestException(
          "Invalid OTP code. " + remainingAttempts + " attempts remaining");
    }

    // Check if new password is same as current password
    if (passwordEncoder.matches(newPassword, user.getPasswordHash())) {
      throw new BusinessException(
          "New password must be different from current password",
          HttpStatus.BAD_REQUEST,
          "SAME_PASSWORD"
      );
    }

    // Update password
    user.setPasswordHash(passwordEncoder.encode(newPassword));
    userRepository.save(user);

    // Mark request as verified
    passwordResetRequest.setStatus(PasswordResetStatus.VERIFIED);
    passwordResetRequestRepository.save(passwordResetRequest);

    log.info("Password reset successfully for email: {}", email);
  }

  // Admin operations - Reader management

  @Override
  @Transactional(readOnly = true)
  public Page<AdminReaderResponse> getAllReaders(
      UserStatus status, String search, Pageable pageable) {
    log.info("Admin getting all readers - status: {}, search: {}", status, search);

    Specification<User> spec = UserSpecification.withFilters(UserRole.READER, status, search);
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

    return buildAdminReaderResponse(user);
  }

  // Admin operations - Reviewer management

  @Override
  @Transactional(readOnly = true)
  public Page<AdminReviewerResponse> getAllReviewers(
      UserStatus status, String search, Pageable pageable) {
    log.info("Admin getting all reviewers - status: {}, search: {}", status, search);

    Specification<User> spec = UserSpecification.withFilters(UserRole.REVIEWER, status, search);
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

    return buildAdminReviewerResponse(user);
  }

  // Admin operations - Organization management

  @Override
  @Transactional(readOnly = true)
  public Page<AdminOrganizationResponse> getAllOrganizations(
      UserStatus status, String search, Pageable pageable) {
    log.info("Admin getting all organizations - status: {}, search: {}", status, search);

    Specification<User> spec = UserSpecification.withFilters(UserRole.ORGANIZATION_ADMIN, status,
        search);
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

    return buildAdminOrganizationResponse(user);
  }

  // Helper methods

  private AdminReaderResponse buildAdminReaderResponse(
      User user) {
    AdminReaderResponse.AdminReaderResponseBuilder builder =
        AdminReaderResponse.builder()
            .userId(user.getId())
            .email(user.getEmail())
            .fullName(user.getFullName())
            .avatarUrl(user.getAvatarUrl())
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
            .avatarUrl(user.getAvatarUrl())
//            .point(user.getPoint())
            .status(user.getStatus())
            .createdAt(user.getCreatedAt())
            .updatedAt(user.getUpdatedAt());

    reviewerProfileRepository.findByUserId(user.getId()).ifPresent(profile -> {
      // Force initialize lazy collection
      profile.getCredentialFileUrls().size();

      builder
          .dateOfBirth(profile.getDateOfBirth())
          .ordid(profile.getOrdid())
          .educationLevel(profile.getEducationLevel())
          .organizationName(profile.getOrganizationName())
          .organizationEmail(profile.getOrganizationEmail())
          .credentialFileUrls(profile.getCredentialFileUrls());
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
            .avatarUrl(user.getAvatarUrl())
//            .point(user.getPoint())
            .status(user.getStatus())
            .createdAt(user.getCreatedAt())
            .updatedAt(user.getUpdatedAt());

    organizationProfileRepository.findByUserId(user.getId()).ifPresent(profile -> {
      builder
          .orgName(profile.getName())
          .orgType(profile.getType() != null ? profile.getType().name() : null)
          .orgEmail(profile.getEmail())
          .orgHotline(profile.getHotline())
          .orgLogo(profile.getLogo())
          .orgAddress(profile.getAddress())
          .orgRegistrationNumber(profile.getRegistrationNumber());
    });

    return builder.build();
  }
}
