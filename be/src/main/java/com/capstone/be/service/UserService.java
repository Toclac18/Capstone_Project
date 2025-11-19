package com.capstone.be.service;

import com.capstone.be.domain.enums.UserStatus;
import com.capstone.be.dto.request.admin.UpdateUserStatusRequest;
import com.capstone.be.dto.request.user.ChangeEmailRequest;
import com.capstone.be.dto.request.user.ChangePasswordRequest;
import com.capstone.be.dto.response.admin.AdminOrganizationResponse;
import com.capstone.be.dto.response.admin.AdminReaderResponse;
import com.capstone.be.dto.response.admin.AdminReviewerResponse;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service for user-related operations
 */
public interface UserService {

  /**
   * Change user password
   *
   * @param userId  User ID
   * @param request Change password request
   */
  void changePassword(UUID userId, ChangePasswordRequest request);

  /**
   * Request email change - sends OTP to current email address
   *
   * @param userId  User ID
   * @param request Change email request (contains new email)
   */
  void requestEmailChange(UUID userId, ChangeEmailRequest request);

  /**
   * Verify OTP and update user's email
   *
   * @param userId User ID
   * @param otp    6-digit OTP code
   */
  void verifyEmailChangeOtp(UUID userId, String otp);

  /**
   * Request password reset - sends OTP to user's email address
   *
   * @param email User email address
   */
  void requestPasswordReset(String email);

  /**
   * Verify OTP and reset user's password
   *
   * @param email       User email address
   * @param otp         6-digit OTP code
   * @param newPassword New password
   */
  void verifyPasswordResetOtp(String email, String otp, String newPassword);

  /**
   * Delete user account (soft delete - set status to DELETED)
   *
   * @param userId User ID
   */
  void deleteAccount(UUID userId);

  // Admin operations - Reader management

  /**
   * Get all readers with optional filters (Admin only)
   *
   * @param status   Filter by status (optional)
   * @param search   Search by email or name (optional)
   * @param pageable Pagination
   * @return Page of AdminReaderResponse
   */
  Page<AdminReaderResponse> getAllReaders(UserStatus status, String search, Pageable pageable);

  /**
   * Get reader detail by ID (Admin only)
   *
   * @param userId User ID
   * @return AdminReaderResponse
   */
  AdminReaderResponse getReaderDetail(UUID userId);

  /**
   * Update reader status (Admin only)
   *
   * @param userId  User ID
   * @param request Update status request
   * @return Updated AdminReaderResponse
   */
  AdminReaderResponse updateReaderStatus(UUID userId, UpdateUserStatusRequest request);

  // Admin operations - Reviewer management

  /**
   * Get all reviewers with optional filters (Admin only)
   *
   * @param status   Filter by status (optional)
   * @param search   Search by email or name (optional)
   * @param pageable Pagination
   * @return Page of AdminReviewerResponse
   */
  Page<AdminReviewerResponse> getAllReviewers(UserStatus status, String search, Pageable pageable);

  /**
   * Get reviewer detail by ID (Admin only)
   *
   * @param userId User ID
   * @return AdminReviewerResponse
   */
  AdminReviewerResponse getReviewerDetail(UUID userId);

  /**
   * Update reviewer status (Admin only)
   *
   * @param userId  User ID
   * @param request Update status request
   * @return Updated AdminReviewerResponse
   */
  AdminReviewerResponse updateReviewerStatus(UUID userId, UpdateUserStatusRequest request);

  // Admin operations - Organization management

  /**
   * Get all organizations with optional filters (Admin only)
   *
   * @param status   Filter by status (optional)
   * @param search   Search by email or name (optional)
   * @param pageable Pagination
   * @return Page of AdminOrganizationResponse
   */
  Page<AdminOrganizationResponse> getAllOrganizations(UserStatus status, String search,
      Pageable pageable);

  /**
   * Get organization detail by ID (Admin only)
   *
   * @param userId User ID
   * @return AdminOrganizationResponse
   */
  AdminOrganizationResponse getOrganizationDetail(UUID userId);

  /**
   * Update organization status (Admin only)
   *
   * @param userId  User ID
   * @param request Update status request
   * @return Updated AdminOrganizationResponse
   */
  AdminOrganizationResponse updateOrganizationStatus(UUID userId, UpdateUserStatusRequest request);
}
