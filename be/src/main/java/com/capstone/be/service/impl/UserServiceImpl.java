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
import com.capstone.be.dto.request.admin.UpdateUserStatusRequest;
import com.capstone.be.dto.request.user.ChangeEmailRequest;
import com.capstone.be.dto.request.user.ChangePasswordRequest;
import com.capstone.be.dto.response.admin.AdminOrganizationResponse;
import com.capstone.be.dto.response.admin.AdminReaderResponse;
import com.capstone.be.dto.response.admin.AdminReviewerResponse;
import com.capstone.be.exception.BusinessException;
import com.capstone.be.exception.DuplicateResourceException;
import com.capstone.be.exception.InvalidRequestException;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.repository.EmailChangeRequestRepository;
import com.capstone.be.repository.OrganizationProfileRepository;
import com.capstone.be.repository.PasswordResetRequestRepository;
import com.capstone.be.repository.PasswordResetTokenRepository;
import com.capstone.be.repository.ReaderProfileRepository;
import com.capstone.be.repository.ReviewerProfileRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.repository.specification.UserSpecification;
import com.capstone.be.service.EmailService;
import com.capstone.be.service.FileStorageService;
import com.capstone.be.service.UserService;
import com.capstone.be.util.OtpUtil;
import com.capstone.be.util.TokenUtil;
import java.time.Instant;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
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
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final ReaderProfileRepository readerProfileRepository;
  private final ReviewerProfileRepository reviewerProfileRepository;
  private final OrganizationProfileRepository organizationProfileRepository;
  private final EmailChangeRequestRepository emailChangeRequestRepository;
  private final PasswordResetRequestRepository passwordResetRequestRepository;
  private final PasswordResetTokenRepository passwordResetTokenRepository;

  private final EmailService emailService;
  private final FileStorageService fileStorageService;

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
  public void uploadAvatar(UUID userId, MultipartFile file) {
    log.info("Uploading avatar for user ID: {}", userId);

    // Get user
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

    //Check file's content type
    final List<String> ALLOWED_CONTENT_TYPES = List.of(
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/gif",
        "image/webp"
    );

    if (!ALLOWED_CONTENT_TYPES.contains(file.getContentType())) {
      throw new IllegalArgumentException(
          "Invalid file type. Allowed types: JPEG, PNG, JPG, GIF, WEBP");
    }

    // Delete old avatar if exists
    if (user.getAvatarKey() != null && !user.getAvatarKey().isEmpty()) {
      try {
        fileStorageService.deleteFile(
            FileStorage.AVATAR_FOLDER, user.getAvatarKey());
        log.info("Deleted old avatar for user ID: {}", userId);
      } catch (Exception e) {
        log.warn("Failed to delete old avatar, continuing with upload: {}", e.getMessage());
      }
    }

    // Upload new avatar to S3
    String avatarKey = fileStorageService.uploadFile(file, FileStorage.AVATAR_FOLDER, null);
    user.setAvatarKey(avatarKey);

    // Save user
    userRepository.save(user);

    log.info("Successfully uploaded avatar for user ID: {}", userId);
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
  public void sendPasswordResetOtp(String email) {
    log.info("Send password reset OTP for email: {}", email);

    // Rate limiting: check recent requests (max 3 requests per 15 minutes)
    Instant rateLimitWindow = Instant.now().minusSeconds(900); // 15 minutes
    long recentRequestCount = passwordResetRequestRepository.countRecentRequestsByEmail(
        email, rateLimitWindow);

    if (recentRequestCount >= 3) {
      log.warn("Rate limit exceeded for email: {}", email);
      // Return generic message without revealing if email exists
      return;
    }

    // Find user by email
    Optional<User> userOptional = userRepository.findByEmail(email);

    // Always return success to prevent email enumeration
    if (userOptional.isEmpty()) {
      log.info("User not found for email: {}, returning generic success", email);
      return;
    }

    User user = userOptional.get();

    // Check if user is active
    if (user.getStatus() != UserStatus.ACTIVE) {
      log.info("User account not active for: {}, returning generic success", email);
      return;
    }

    // Cancel any existing pending request for this user
    passwordResetRequestRepository.findByUserAndStatus(
        user,
        PasswordResetStatus.PENDING
    ).ifPresent(existing -> {
      existing.setStatus(PasswordResetStatus.CANCELLED);
      passwordResetRequestRepository.save(existing);
    });

    // Generate OTP (6 digits, valid for 10 minutes)
    String otp = OtpUtil.generateOtp();
    String otpHash = passwordEncoder.encode(otp);
    Instant otpExpiry = Instant.now().plusSeconds(600); // 10 minutes

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

    log.info("Created password reset request and sent OTP to email: {}", user.getEmail());
  }

  @Override
  @Transactional(noRollbackFor = InvalidRequestException.class)
  public String verifyOtpAndGenerateResetToken(String email, String otp) {
    log.info("Verify OTP for email: {}", email);

    // Find user by email
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new InvalidRequestException("Invalid credentials"));

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

    // Verify OTP using password encoder (constant-time comparison)
    if (!passwordEncoder.matches(otp, passwordResetRequest.getOtpHash())) {
      passwordResetRequestRepository.save(passwordResetRequest);
      int remainingAttempts = 5 - passwordResetRequest.getAttemptCount();
      throw new InvalidRequestException(
          "Invalid OTP code. " + remainingAttempts + " attempts remaining");
    }

    // OTP is valid - mark request as verified
    passwordResetRequest.setStatus(PasswordResetStatus.VERIFIED);
    passwordResetRequestRepository.save(passwordResetRequest);

    // Invalidate any existing reset tokens for this user
    passwordResetTokenRepository.invalidateAllUserTokens(user);

    // Generate new reset token (valid for 10 minutes)
    String resetToken = TokenUtil.generateResetToken();
    String tokenHash = passwordEncoder.encode(resetToken);
    Instant tokenExpiry = Instant.now().plusSeconds(600); // 10 minutes

    PasswordResetToken passwordResetToken = PasswordResetToken.builder()
        .user(user)
        .tokenHash(tokenHash)
        .expiryTime(tokenExpiry)
        .used(false)
        .build();

    passwordResetTokenRepository.save(passwordResetToken);

    log.info("OTP verified and reset token generated for user: {}", user.getEmail());
    return resetToken;
  }

  @Override
  @Transactional
  public void resetPasswordWithToken(String resetToken, String newPassword) {
    log.info("Reset password with token");

    // Hash the token to find it in DB
    // We need to find the token differently since we can't hash and search
    // Instead, we'll iterate through recent tokens and verify
    List<PasswordResetToken> recentTokens = passwordResetTokenRepository
        .findAll()
        .stream()
        .filter(t -> !t.getUsed() && !t.isExpired())
        .toList();

    PasswordResetToken validToken = null;
    for (PasswordResetToken token : recentTokens) {
      if (passwordEncoder.matches(resetToken, token.getTokenHash())) {
        validToken = token;
        break;
      }
    }

    if (validToken == null) {
      throw new InvalidRequestException("Invalid or expired reset token");
    }

    // Check if token has been used
    if (validToken.getUsed()) {
      throw new InvalidRequestException("Reset token has already been used");
    }

    User user = validToken.getUser();

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

    // Mark token as used
    validToken.setUsed(true);
    passwordResetTokenRepository.save(validToken);

    log.info("Password reset successfully for user: {}", user.getEmail());
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
}
