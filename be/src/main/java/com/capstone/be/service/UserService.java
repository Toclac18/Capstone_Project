package com.capstone.be.service;

import com.capstone.be.domain.enums.UserStatus;
import com.capstone.be.dto.request.admin.UpdateUserStatusRequest;
import com.capstone.be.dto.request.user.ChangePasswordRequest;
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
  Page<com.capstone.be.dto.response.admin.AdminReaderResponse> getAllReaders(
      UserStatus status, String search, Pageable pageable);

  /**
   * Get reader detail by ID (Admin only)
   *
   * @param userId User ID
   * @return AdminReaderResponse
   */
  com.capstone.be.dto.response.admin.AdminReaderResponse getReaderDetail(UUID userId);

  /**
   * Update reader status (Admin only)
   *
   * @param userId  User ID
   * @param request Update status request
   * @return Updated AdminReaderResponse
   */
  com.capstone.be.dto.response.admin.AdminReaderResponse updateReaderStatus(
      UUID userId, UpdateUserStatusRequest request);

  // Admin operations - Reviewer management

  /**
   * Get all reviewers with optional filters (Admin only)
   *
   * @param status   Filter by status (optional)
   * @param search   Search by email or name (optional)
   * @param pageable Pagination
   * @return Page of AdminReviewerResponse
   */
  Page<com.capstone.be.dto.response.admin.AdminReviewerResponse> getAllReviewers(
      UserStatus status, String search, Pageable pageable);

  /**
   * Get reviewer detail by ID (Admin only)
   *
   * @param userId User ID
   * @return AdminReviewerResponse
   */
  com.capstone.be.dto.response.admin.AdminReviewerResponse getReviewerDetail(UUID userId);

  /**
   * Update reviewer status (Admin only)
   *
   * @param userId  User ID
   * @param request Update status request
   * @return Updated AdminReviewerResponse
   */
  com.capstone.be.dto.response.admin.AdminReviewerResponse updateReviewerStatus(
      UUID userId, UpdateUserStatusRequest request);

  // Admin operations - Organization management

  /**
   * Get all organizations with optional filters (Admin only)
   *
   * @param status   Filter by status (optional)
   * @param search   Search by email or name (optional)
   * @param pageable Pagination
   * @return Page of AdminOrganizationResponse
   */
  Page<com.capstone.be.dto.response.admin.AdminOrganizationResponse> getAllOrganizations(
      UserStatus status, String search, Pageable pageable);

  /**
   * Get organization detail by ID (Admin only)
   *
   * @param userId User ID
   * @return AdminOrganizationResponse
   */
  com.capstone.be.dto.response.admin.AdminOrganizationResponse getOrganizationDetail(UUID userId);

  /**
   * Update organization status (Admin only)
   *
   * @param userId  User ID
   * @param request Update status request
   * @return Updated AdminOrganizationResponse
   */
  com.capstone.be.dto.response.admin.AdminOrganizationResponse updateOrganizationStatus(
      UUID userId, UpdateUserStatusRequest request);
}
