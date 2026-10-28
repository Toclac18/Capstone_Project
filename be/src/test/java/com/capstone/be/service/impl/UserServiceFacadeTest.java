package com.capstone.be.service.impl;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import com.capstone.be.domain.enums.UserStatus;
import com.capstone.be.service.AdminUserService;
import com.capstone.be.service.UserAccountService;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

/**
 * Facade chuyển tiếp đúng chỗ.
 *
 * <p>Service này là ca rủi ro nhất trong ba lần tách: có BA bộ ba phương thức cùng
 * chữ ký — getAllReaders/Reviewers/Organizations nhận (UserStatus, String, Pageable),
 * getXDetail nhận (UUID), và updateXStatus nhận (UUID, UpdateUserStatusRequest).
 * Compiler không phân biệt được chuyển tiếp lẫn giữa chúng; test này làm việc đó.
 */
@ExtendWith(MockitoExtension.class)
class UserServiceFacadeTest {

  @Mock private UserAccountService accountService;
  @Mock private AdminUserService adminUserService;

  @InjectMocks private UserServiceImpl facade;

  private final UUID userId = UUID.randomUUID();
  private final Pageable page = Pageable.unpaged();

  @Test
  @DisplayName("Ba phương thức liệt kê cùng chữ ký không bị lẫn vào nhau")
  void threeListsDoNotSwap() {
    facade.getAllReaders(UserStatus.ACTIVE, "x", page);
    verify(adminUserService).getAllReaders(eq(UserStatus.ACTIVE), eq("x"), eq(page));
    verify(adminUserService, never()).getAllReviewers(any(), any(), any());
    verify(adminUserService, never()).getAllOrganizations(any(), any(), any());

    facade.getAllReviewers(UserStatus.ACTIVE, "x", page);
    verify(adminUserService).getAllReviewers(eq(UserStatus.ACTIVE), eq("x"), eq(page));

    facade.getAllOrganizations(UserStatus.ACTIVE, "x", page);
    verify(adminUserService).getAllOrganizations(eq(UserStatus.ACTIVE), eq("x"), eq(page));
  }

  @Test
  @DisplayName("Ba phương thức xem chi tiết cùng chữ ký (UUID) không bị lẫn")
  void threeDetailsDoNotSwap() {
    facade.getReaderDetail(userId);
    verify(adminUserService).getReaderDetail(eq(userId));
    verify(adminUserService, never()).getReviewerDetail(any());
    verify(adminUserService, never()).getOrganizationDetail(any());

    facade.getReviewerDetail(userId);
    verify(adminUserService).getReviewerDetail(eq(userId));

    facade.getOrganizationDetail(userId);
    verify(adminUserService).getOrganizationDetail(eq(userId));
  }

  @Test
  @DisplayName("Ba phương thức đổi trạng thái cùng chữ ký không bị lẫn")
  void threeStatusUpdatesDoNotSwap() {
    facade.updateReaderStatus(userId, null);
    verify(adminUserService).updateReaderStatus(eq(userId), eq(null));
    verify(adminUserService, never()).updateReviewerStatus(any(), any());
    verify(adminUserService, never()).updateOrganizationStatus(any(), any());

    facade.updateReviewerStatus(userId, null);
    verify(adminUserService).updateReviewerStatus(eq(userId), eq(null));

    facade.updateOrganizationStatus(userId, null);
    verify(adminUserService).updateOrganizationStatus(eq(userId), eq(null));
  }

  @Test
  @DisplayName("Luồng tự phục vụ đi vào AccountService, không chạm AdminUserService")
  void selfServiceGoesToAccountService() {
    facade.changePassword(userId, null);
    facade.deleteAccount(userId, "pw");
    facade.uploadAvatar(userId, null);
    facade.sendPasswordResetOtp("a@example.com");
    facade.resetPasswordWithToken("tok", "newpw");

    verify(accountService).changePassword(eq(userId), eq(null));
    verify(accountService).deleteAccount(eq(userId), eq("pw"));
    verify(accountService).uploadAvatar(eq(userId), eq(null));
    verify(accountService).sendPasswordResetOtp(eq("a@example.com"));
    verify(accountService).resetPasswordWithToken(eq("tok"), eq("newpw"));
    verifyNoInteractions(adminUserService);
  }

  @Test
  @DisplayName("Hai bước OTP đổi email không bị đổi chỗ")
  void emailChangeStepsDoNotSwap() {
    facade.verifyPasswordForEmailChange(userId, "pw");
    verify(accountService).verifyPasswordForEmailChange(eq(userId), eq("pw"));
    verify(accountService, never()).verifyEmailChangeOtp(any(), any());

    facade.verifyEmailChangeOtp(userId, "123456");
    verify(accountService).verifyEmailChangeOtp(eq(userId), eq("123456"));
  }

  @Test
  @DisplayName("verifyOtpAndGenerateResetToken trả về giá trị từ AccountService")
  void resetTokenReturnsValue() {
    org.mockito.Mockito.when(
            accountService.verifyOtpAndGenerateResetToken("a@example.com", "123456"))
        .thenReturn("token-abc");

    org.assertj.core.api.Assertions
        .assertThat(facade.verifyOtpAndGenerateResetToken("a@example.com", "123456"))
        .isEqualTo("token-abc");
  }

  @Test
  @DisplayName("Quản trị vai trò đi vào AdminUserService")
  void roleManagementGoesToAdmin() {
    facade.changeUserRole(userId, null, userId);

    verify(adminUserService).changeUserRole(eq(userId), eq(null), eq(userId));
    verifyNoInteractions(accountService);
  }
}
