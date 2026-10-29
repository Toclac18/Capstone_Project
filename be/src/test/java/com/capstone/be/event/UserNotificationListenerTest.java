package com.capstone.be.event;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.capstone.be.domain.entity.OrgEnrollment;
import com.capstone.be.domain.entity.OrganizationProfile;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.OrgEnrollStatus;
import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.domain.enums.UserStatus;
import com.capstone.be.repository.OrgEnrollmentRepository;
import com.capstone.be.repository.OrganizationProfileRepository;
import com.capstone.be.service.EmailService;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class UserNotificationListenerTest {

  @Mock private EmailService emailService;
  @Mock private OrganizationProfileRepository organizationProfileRepository;
  @Mock private OrgEnrollmentRepository orgEnrollmentRepository;

  @InjectMocks private UserNotificationListener listener;

  private final UUID adminId = UUID.randomUUID();

  private static User member(String email) {
    User u = new User();
    u.setId(UUID.randomUUID());
    u.setEmail(email);
    u.setFullName("Thành viên");
    return u;
  }

  private static OrgEnrollment enrollment(User m) {
    OrgEnrollment e = new OrgEnrollment();
    e.setMember(m);
    return e;
  }

  @Test
  @DisplayName("Đổi trạng thái user: gửi đúng giá trị từ event")
  void userStatus() {
    listener.onUserStatusChanged(new UserStatusChangedEvent(
        adminId, "a@example.com", "Người A", UserStatus.INACTIVE, "Vi phạm"));

    verify(emailService).sendUserStatusUpdateEmail(
        eq("a@example.com"), eq("Người A"), eq(UserStatus.INACTIVE), eq("Vi phạm"));
  }

  @Test
  @DisplayName("Đổi vai trò: truyền cả vai trò cũ và mới")
  void roleChange() {
    listener.onUserRoleChanged(new UserRoleChangedEvent(
        adminId, "a@example.com", "Người A", UserRole.READER, UserRole.REVIEWER, "Thăng cấp"));

    verify(emailService).sendUserRoleChangeEmail(
        eq("a@example.com"), eq("Người A"),
        eq(UserRole.READER), eq(UserRole.REVIEWER), eq("Thăng cấp"));
  }

  @Test
  @DisplayName("Email lỗi: listener không ném ra ngoài")
  void swallowsFailure() {
    doThrow(new RuntimeException("SMTP down"))
        .when(emailService).sendUserStatusUpdateEmail(anyString(), anyString(), any(), anyString());

    listener.onUserStatusChanged(new UserStatusChangedEvent(
        adminId, "a@example.com", "Người A", UserStatus.ACTIVE, "ok"));

    verify(emailService).sendUserStatusUpdateEmail(anyString(), anyString(), any(), anyString());
  }

  @Test
  @DisplayName("Đổi trạng thái tổ chức: gửi cho admin RỒI fan-out qua mọi trang thành viên")
  void organizationFanOutPaginates() {
    OrganizationProfile org = new OrganizationProfile();
    org.setName("FPTU");
    when(organizationProfileRepository.findByAdminId(adminId)).thenReturn(Optional.of(org));

    // hai trang: trang đầu còn trang sau, trang hai là cuối
    var page0 = new PageImpl<>(List.of(enrollment(member("m1@example.com"))),
        PageRequest.of(0, 100), 101);
    var page1 = new PageImpl<>(List.of(enrollment(member("m2@example.com"))),
        PageRequest.of(1, 100), 101);
    when(orgEnrollmentRepository.findByOrganizationAndStatus(
        eq(org), eq(OrgEnrollStatus.JOINED), any()))
        .thenReturn(page0, page1);

    listener.onOrganizationStatusChanged(new OrganizationStatusChangedEvent(
        adminId, "admin@example.com", "Quản trị", UserStatus.INACTIVE, "Tạm dừng"));

    verify(emailService).sendOrganizationStatusUpdateEmail(
        eq("admin@example.com"), eq("Quản trị"), eq(UserStatus.INACTIVE), eq("Tạm dừng"));
    verify(emailService).sendOrganizationMemberStatusUpdateEmail(
        eq("m1@example.com"), anyString(), eq("FPTU"), eq(UserStatus.INACTIVE), eq("Tạm dừng"));
    verify(emailService).sendOrganizationMemberStatusUpdateEmail(
        eq("m2@example.com"), anyString(), eq("FPTU"), eq(UserStatus.INACTIVE), eq("Tạm dừng"));
  }

  @Test
  @DisplayName("Thành viên không có email: bỏ qua, không làm hỏng fan-out")
  void skipsMembersWithoutEmail() {
    OrganizationProfile org = new OrganizationProfile();
    org.setName("FPTU");
    when(organizationProfileRepository.findByAdminId(adminId)).thenReturn(Optional.of(org));
    when(orgEnrollmentRepository.findByOrganizationAndStatus(any(), any(), any()))
        .thenReturn(new PageImpl<>(
            List.of(enrollment(member(null)), enrollment(member("ok@example.com"))),
            PageRequest.of(0, 100), 2));

    listener.onOrganizationStatusChanged(new OrganizationStatusChangedEvent(
        adminId, "admin@example.com", "Quản trị", UserStatus.ACTIVE, "ok"));

    verify(emailService).sendOrganizationMemberStatusUpdateEmail(
        eq("ok@example.com"), anyString(), anyString(), any(), anyString());
    verify(emailService, never()).sendOrganizationMemberStatusUpdateEmail(
        eq(null), anyString(), anyString(), any(), anyString());
  }

  @Test
  @DisplayName("Không tìm thấy tổ chức: dừng êm, không ném")
  void noOrganizationFound() {
    when(organizationProfileRepository.findByAdminId(adminId)).thenReturn(Optional.empty());

    listener.onOrganizationStatusChanged(new OrganizationStatusChangedEvent(
        adminId, "admin@example.com", "Quản trị", UserStatus.ACTIVE, "ok"));

    verify(emailService, never()).sendOrganizationMemberStatusUpdateEmail(
        anyString(), anyString(), anyString(), any(), anyString());
  }

  @Test
  @DisplayName("Cả ba listener chạy SAU commit, không phải trong transaction")
  void allListenAfterCommit() throws Exception {
    for (var m : List.of(
        UserNotificationListener.class.getMethod("onUserStatusChanged", UserStatusChangedEvent.class),
        UserNotificationListener.class.getMethod("onUserRoleChanged", UserRoleChangedEvent.class),
        UserNotificationListener.class.getMethod(
            "onOrganizationStatusChanged", OrganizationStatusChangedEvent.class))) {
      var ann = m.getAnnotation(TransactionalEventListener.class);
      assertThat(ann).as(m.getName()).isNotNull();
      assertThat(ann.phase()).as(m.getName()).isEqualTo(TransactionPhase.AFTER_COMMIT);
    }
  }
}
