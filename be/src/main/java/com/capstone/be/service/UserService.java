package com.capstone.be.service;

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
import java.time.Instant;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

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
   * Verify password for email change
   *
   * @param userId  User ID
   * @param password User password for verification
   */
  void verifyPasswordForEmailChange(UUID userId, String password);

  /**
   * Request email change - sends OTP to new email address
   * Requires password verification first
   *
   * @param userId  User ID
   * @param request Change email request (contains password and new email)
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
   * Send OTP for password reset (Step 1)
   * Rate limited to prevent abuse
   *
   * @param email User email
   */
  void sendPasswordResetOtp(String email);

  /**
   * Verify OTP and return reset token (Step 2)
   * Does NOT reset password, only validates OTP and generates reset token
   *
   * @param email User email
   * @param otp   6-digit OTP code
   * @return Reset token for password change
   */
  String verifyOtpAndGenerateResetToken(String email, String otp);

  /**
   * Reset password using reset token (Step 3)
   *
   * @param resetToken  One-time reset token from OTP verification
   * @param newPassword New password
   */
  void resetPasswordWithToken(String resetToken, String newPassword);

  /**
   * Delete user account (soft delete - set status to DELETED)
   * Requires password verification
   *
   * @param userId  User ID
   * @param password User password for verification
   */
  void deleteAccount(UUID userId, String password);

  void uploadAvatar(UUID userId, MultipartFile file);

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

  // System Admin operations - Role management

  /**
   * Get all users with optional filters for role management (System Admin only)
   *
   * @param search   Search by email or name (optional)
   * @param role     Filter by role (optional)
   * @param status   Filter by status (optional)
   * @param dateFrom Filter by created date from (optional)
   * @param dateTo   Filter by created date to (optional)
   * @param pageable Pagination
   * @return Page of UserManagementResponse
   */
  Page<UserManagementResponse> getAllUsersForRoleManagement(
      String search, UserRole role, UserStatus status,
      Instant dateFrom, Instant dateTo, Pageable pageable);

  /**
   * Change user role (System Admin only)
   *
   * @param userId      User ID
   * @param request     Change role request
   * @param changedBy   ID of the admin who made the change (for audit log)
   * @return Updated UserManagementResponse
   */
  UserManagementResponse changeUserRole(
      UUID userId, ChangeRoleRequest request, UUID changedBy);
}
