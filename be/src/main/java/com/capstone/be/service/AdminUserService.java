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
 * Quản trị người dùng: liệt kê, xem chi tiết, đổi trạng thái reader/reviewer/organization,
 * và đổi vai trò (System Admin).
 *
 * <p>Tách khỏi {@link UserAccountService} — xem javadoc ở đó.
 */
public interface AdminUserService {

  // Reader
  Page<AdminReaderResponse> getAllReaders(UserStatus status, String search, Pageable pageable);

  AdminReaderResponse getReaderDetail(UUID userId);

  AdminReaderResponse updateReaderStatus(UUID userId, UpdateUserStatusRequest request);

  // Reviewer
  Page<AdminReviewerResponse> getAllReviewers(UserStatus status, String search, Pageable pageable);

  AdminReviewerResponse getReviewerDetail(UUID userId);

  AdminReviewerResponse updateReviewerStatus(UUID userId, UpdateUserStatusRequest request);

  // Organization
  Page<AdminOrganizationResponse> getAllOrganizations(UserStatus status, String search,
      Pageable pageable);

  AdminOrganizationResponse getOrganizationDetail(UUID userId);

  AdminOrganizationResponse updateOrganizationStatus(UUID userId,
      UpdateUserStatusRequest request);

  // Role management (System Admin)
  Page<UserManagementResponse> getAllUsersForRoleManagement(
      String search, UserRole role, UserStatus status,
      Instant dateFrom, Instant dateTo, Pageable pageable);

  UserManagementResponse changeUserRole(UUID userId, ChangeRoleRequest request, UUID changedBy);
}
