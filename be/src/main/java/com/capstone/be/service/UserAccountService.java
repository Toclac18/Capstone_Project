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
 * Người dùng tự thao tác trên tài khoản của chính mình: mật khẩu, đổi email, avatar,
 * đặt lại mật khẩu qua OTP.
 *
 * <p>Tách khỏi {@link AdminUserService} vì hai nhóm này gần như không dùng chung gì:
 * chỉ {@code userRepository} và {@code emailService} là chung, 12 phụ thuộc còn lại
 * thuộc riêng một bên. "UserService" cũ đang làm hai việc không liên quan nhau.
 */
public interface UserAccountService {

  void changePassword(UUID userId, ChangePasswordRequest request);

  void verifyPasswordForEmailChange(UUID userId, String password);

  void requestEmailChange(UUID userId, ChangeEmailRequest request);

  void verifyEmailChangeOtp(UUID userId, String otp);

  void sendPasswordResetOtp(String email);

  String verifyOtpAndGenerateResetToken(String email, String otp);

  void resetPasswordWithToken(String resetToken, String newPassword);

  void deleteAccount(UUID userId, String password);

  void uploadAvatar(UUID userId, MultipartFile file);
}
