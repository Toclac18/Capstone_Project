package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.domain.enums.UserStatus;
import com.capstone.be.dto.request.user.ChangePasswordRequest;
import com.capstone.be.dto.response.admin.AdminReaderResponse;
import com.capstone.be.exception.BusinessException;
import com.capstone.be.repository.OrganizationProfileRepository;
import com.capstone.be.repository.ReaderProfileRepository;
import com.capstone.be.repository.ReviewerProfileRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.repository.specification.UserSpecification;
import com.capstone.be.service.UserService;
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
  public com.capstone.be.dto.response.admin.AdminReaderResponse getReaderDetail(UUID userId) {
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
  public com.capstone.be.dto.response.admin.AdminReaderResponse updateReaderStatus(
      UUID userId, com.capstone.be.dto.request.admin.UpdateUserStatusRequest request) {
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
  public Page<com.capstone.be.dto.response.admin.AdminReviewerResponse> getAllReviewers(
      UserStatus status, String search, Pageable pageable) {
    log.info("Admin getting all reviewers - status: {}, search: {}", status, search);

    Specification<User> spec = UserSpecification.withFilters(UserRole.REVIEWER, status, search);
    Page<User> users = userRepository.findAll(spec, pageable);

    return users.map(this::buildAdminReviewerResponse);
  }

  @Override
  @Transactional(readOnly = true)
  public com.capstone.be.dto.response.admin.AdminReviewerResponse getReviewerDetail(UUID userId) {
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
  public com.capstone.be.dto.response.admin.AdminReviewerResponse updateReviewerStatus(
      UUID userId, com.capstone.be.dto.request.admin.UpdateUserStatusRequest request) {
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
  public Page<com.capstone.be.dto.response.admin.AdminOrganizationResponse> getAllOrganizations(
      UserStatus status, String search, Pageable pageable) {
    log.info("Admin getting all organizations - status: {}, search: {}", status, search);

    Specification<User> spec = UserSpecification.withFilters(UserRole.ORGANIZATION_ADMIN, status,
        search);
    Page<User> users = userRepository.findAll(spec, pageable);

    return users.map(this::buildAdminOrganizationResponse);
  }

  @Override
  @Transactional(readOnly = true)
  public com.capstone.be.dto.response.admin.AdminOrganizationResponse getOrganizationDetail(
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
  public com.capstone.be.dto.response.admin.AdminOrganizationResponse updateOrganizationStatus(
      UUID userId, com.capstone.be.dto.request.admin.UpdateUserStatusRequest request) {
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

  private com.capstone.be.dto.response.admin.AdminReaderResponse buildAdminReaderResponse(
      User user) {
    com.capstone.be.dto.response.admin.AdminReaderResponse.AdminReaderResponseBuilder builder =
        com.capstone.be.dto.response.admin.AdminReaderResponse.builder()
            .userId(user.getId())
            .email(user.getEmail())
            .fullName(user.getFullName())
            .avatarUrl(user.getAvatarUrl())
            .point(user.getPoint())
            .status(user.getStatus())
            .createdAt(user.getCreatedAt())
            .updatedAt(user.getUpdatedAt());

    readerProfileRepository.findByUserId(user.getId()).ifPresent(profile -> {
      builder.dob(profile.getDob());
    });

    return builder.build();
  }

  private com.capstone.be.dto.response.admin.AdminReviewerResponse buildAdminReviewerResponse(
      User user) {
    com.capstone.be.dto.response.admin.AdminReviewerResponse.AdminReviewerResponseBuilder builder =
        com.capstone.be.dto.response.admin.AdminReviewerResponse.builder()
            .userId(user.getId())
            .email(user.getEmail())
            .fullName(user.getFullName())
            .avatarUrl(user.getAvatarUrl())
            .point(user.getPoint())
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

  private com.capstone.be.dto.response.admin.AdminOrganizationResponse buildAdminOrganizationResponse(
      User user) {
    com.capstone.be.dto.response.admin.AdminOrganizationResponse.AdminOrganizationResponseBuilder builder =
        com.capstone.be.dto.response.admin.AdminOrganizationResponse.builder()
            .userId(user.getId())
            .email(user.getEmail())
            .fullName(user.getFullName())
            .avatarUrl(user.getAvatarUrl())
            .point(user.getPoint())
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
