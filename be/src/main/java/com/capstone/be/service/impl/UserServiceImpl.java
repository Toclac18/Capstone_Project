package com.capstone.be.service.impl;

import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.domain.enums.UserStatus;
import com.capstone.be.dto.request.user.ChangeEmailRequest;
import com.capstone.be.dto.request.user.ChangePasswordRequest;
import com.capstone.be.dto.request.admin.ChangeRoleRequest;
import com.capstone.be.dto.request.admin.UpdateUserStatusRequest;
import com.capstone.be.dto.response.admin.AdminOrganizationResponse;
import com.capstone.be.dto.response.admin.AdminReaderResponse;
import com.capstone.be.dto.response.admin.AdminReviewerResponse;
import com.capstone.be.dto.response.admin.UserManagementResponse;
import com.capstone.be.service.AdminUserService;
import com.capstone.be.service.UserAccountService;
import com.capstone.be.service.UserService;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Facade giữ nguyên {@link UserService} để sáu controller không phải đổi.
 *
 * <p>Logic đã chuyển sang hai service theo đúng hai việc mà "UserService" cũ đang gộp:
 *
 * <ul>
 *   <li>{@link UserAccountService} — người dùng tự thao tác trên tài khoản của mình
 *   <li>{@link AdminUserService} — quản trị người dùng
 * </ul>
 *
 * <p>Hai nhóm này chỉ dùng chung {@code userRepository} và {@code emailService};
 * 12 phụ thuộc còn lại thuộc riêng một bên.
 *
 * <p>KHÔNG đặt @Transactional ở đây: transaction boundary thuộc hai service kia.
 *
 * <p>Code mới nên gọi thẳng service tương ứng. Khi sáu controller đã chuyển hết, xoá facade.
 */
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

  private final UserAccountService accountService;
  private final AdminUserService adminUserService;

  // ───────────── tài khoản của chính người dùng ─────────────

  @Override
  public void changePassword(UUID userId, ChangePasswordRequest request) {
    accountService.changePassword(userId, request);
  }

  @Override
  public void verifyPasswordForEmailChange(UUID userId, String password) {
    accountService.verifyPasswordForEmailChange(userId, password);
  }

  @Override
  public void requestEmailChange(UUID userId, ChangeEmailRequest request) {
    accountService.requestEmailChange(userId, request);
  }

  @Override
  public void verifyEmailChangeOtp(UUID userId, String otp) {
    accountService.verifyEmailChangeOtp(userId, otp);
  }

  @Override
  public void sendPasswordResetOtp(String email) {
    accountService.sendPasswordResetOtp(email);
  }

  @Override
  public String verifyOtpAndGenerateResetToken(String email, String otp) {
    return accountService.verifyOtpAndGenerateResetToken(email, otp);
  }

  @Override
  public void resetPasswordWithToken(String resetToken, String newPassword) {
    accountService.resetPasswordWithToken(resetToken, newPassword);
  }

  @Override
  public void deleteAccount(UUID userId, String password) {
    accountService.deleteAccount(userId, password);
  }

  @Override
  public void uploadAvatar(UUID userId, MultipartFile file) {
    accountService.uploadAvatar(userId, file);
  }

  // ───────────── quản trị: reader ─────────────

  @Override
  public Page<AdminReaderResponse> getAllReaders(
      UserStatus status, String search, Pageable pageable) {
    return adminUserService.getAllReaders(status, search, pageable);
  }

  @Override
  public AdminReaderResponse getReaderDetail(UUID userId) {
    return adminUserService.getReaderDetail(userId);
  }

  @Override
  public AdminReaderResponse updateReaderStatus(UUID userId, UpdateUserStatusRequest request) {
    return adminUserService.updateReaderStatus(userId, request);
  }

  // ───────────── quản trị: reviewer ─────────────

  @Override
  public Page<AdminReviewerResponse> getAllReviewers(
      UserStatus status, String search, Pageable pageable) {
    return adminUserService.getAllReviewers(status, search, pageable);
  }

  @Override
  public AdminReviewerResponse getReviewerDetail(UUID userId) {
    return adminUserService.getReviewerDetail(userId);
  }

  @Override
  public AdminReviewerResponse updateReviewerStatus(
      UUID userId, UpdateUserStatusRequest request) {
    return adminUserService.updateReviewerStatus(userId, request);
  }

  // ───────────── quản trị: organization ─────────────

  @Override
  public Page<AdminOrganizationResponse> getAllOrganizations(
      UserStatus status, String search, Pageable pageable) {
    return adminUserService.getAllOrganizations(status, search, pageable);
  }

  @Override
  public AdminOrganizationResponse getOrganizationDetail(UUID userId) {
    return adminUserService.getOrganizationDetail(userId);
  }

  @Override
  public AdminOrganizationResponse updateOrganizationStatus(
      UUID userId, UpdateUserStatusRequest request) {
    return adminUserService.updateOrganizationStatus(userId, request);
  }

  // ───────────── quản trị: vai trò ─────────────

  @Override
  public Page<UserManagementResponse> getAllUsersForRoleManagement(
      String search, UserRole role, UserStatus status,
      Instant dateFrom, Instant dateTo, Pageable pageable) {
    return adminUserService.getAllUsersForRoleManagement(
        search, role, status, dateFrom, dateTo, pageable);
  }

  @Override
  public UserManagementResponse changeUserRole(
      UUID userId, ChangeRoleRequest request, UUID changedBy) {
    return adminUserService.changeUserRole(userId, request, changedBy);
  }
}
