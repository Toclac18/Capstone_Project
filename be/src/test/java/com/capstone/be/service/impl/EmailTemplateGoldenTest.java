package com.capstone.be.service.impl;

import static org.assertj.core.api.Assertions.assertThat;

import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.domain.enums.UserStatus;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.mail.javamail.JavaMailSender;

/**
 * Chốt HTML của từng email email bằng golden file.
 *
 * <p>Mục đích duy nhất: trước khi đưa template ra khỏi code Java, phải có cách chứng
 * minh HTML sinh ra KHÔNG đổi. Test này gọi từng {@code buildXHtml} qua reflection với
 * input cố định rồi so với file trong {@code src/test/resources/email-golden/}.
 *
 * <p>Lần chạy đầu tạo golden file; các lần sau so sánh. Golden file được commit, nên
 * nếu refactor làm đổi dù một ký tự thì test đỏ.
 *
 * <p>Input phủ cả các nhánh rẽ của ba template có điều kiện (DocStatus, UserStatus,
 * trạng thái ticket) — đó là chỗ regression dễ lọt nhất.
 */
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
class EmailTemplateGoldenTest {

  private static final Path GOLDEN = Path.of("src/test/resources/email-golden");
  private static final UUID FIXED_ID =
      UUID.fromString("11111111-2222-3333-4444-555555555555");

  private final EmailServiceImpl service = newService();

  private static EmailServiceImpl newService() {
    JavaMailSender sender = org.mockito.Mockito.mock(JavaMailSender.class);
    // Renderer thật, nạp template từ classpath — đó chính là thứ cần kiểm.
    EmailServiceImpl s = new EmailServiceImpl(
        sender, new com.capstone.be.service.helper.EmailTemplateRenderer());
    set(s, "fromEmail", "no-reply@capstone.test");
    set(s, "verificationBaseUrl", "https://app.test/auth/verify-email");
    set(s, "joinOrganizationBaseUrl", "https://app.test/reader/join-organization");
    set(s, "frontendBaseUrl", "https://app.test");
    return s;
  }

  private static void set(Object target, String name, Object value) {
    try {
      Field f = EmailServiceImpl.class.getDeclaredField(name);
      f.setAccessible(true);
      f.set(target, value);
    } catch (ReflectiveOperationException e) {
      throw new IllegalStateException("Không set được field " + name, e);
    }
  }

  /** Một ca kiểm: tên golden file + tên method + tham số. */
  record Case(String name, String method, Object... args) {
    @Override
    public String toString() {
      return name;
    }
  }

  static List<Case> cases() {
    return List.of(
        new Case("verification", "buildVerificationEmailHtml",
            "reader@test.vn", "https://app.test/auth/verify-email?token=abc"),
        new Case("welcome", "buildWelcomeEmailHtml", "Nguyễn Văn A"),
        new Case("reviewer-rejection", "buildRejectionEmailHtml",
            "Nguyễn Văn A", "Chưa đủ kinh nghiệm"),
        new Case("organization-rejection", "buildOrganizationRejectionEmailHtml",
            "FPTU", "Thiếu giấy tờ"),
        new Case("email-change-otp", "buildEmailChangeOtpHtml", "new@test.vn", "123456"),
        new Case("password-reset-otp", "buildPasswordResetOtpHtml", "Nguyễn Văn A", "654321"),
        new Case("password-reset-confirmation", "buildPasswordResetConfirmationHtml",
            "Nguyễn Văn A"),
        new Case("organization-invitation", "buildOrganizationInvitationHtml",
            "Nguyễn Văn A", "FPTU", FIXED_ID),
        new Case("organization-invitation-token", "buildOrganizationInvitationWithTokenHtml",
            "Nguyễn Văn A", "FPTU", "tok-abc"),
        new Case("account-creation-invitation", "buildAccountCreationInvitationHtml",
            "reader@test.vn", "FPTU"),

        // ── ticket: switch 4 nhánh ──
        new Case("ticket-in-progress", "buildTicketUpdateEmailHtml",
            "Nguyễn Văn A", "TK-001", "IN_PROGRESS", "Đang xử lý"),
        new Case("ticket-resolved", "buildTicketUpdateEmailHtml",
            "Nguyễn Văn A", "TK-001", "RESOLVED", "Đã xong"),
        new Case("ticket-closed", "buildTicketUpdateEmailHtml",
            "Nguyễn Văn A", "TK-001", "CLOSED", null),
        new Case("ticket-default", "buildTicketUpdateEmailHtml",
            "Nguyễn Văn A", "TK-001", "PENDING", "   "),

        // ── user status ──
        new Case("user-status-active", "buildUserStatusUpdateEmailHtml",
            "Nguyễn Văn A", UserStatus.ACTIVE, "Đã xác minh"),
        new Case("user-status-inactive", "buildUserStatusUpdateEmailHtml",
            "Nguyễn Văn A", UserStatus.INACTIVE, null),
        new Case("organization-status-active", "buildOrganizationStatusUpdateEmailHtml",
            "FPTU", UserStatus.ACTIVE, "Hồ sơ hợp lệ"),

        // ── document status: 6 nhánh ──
        new Case("document-active", "buildDocumentStatusUpdateEmailHtml",
            "Nguyễn Văn A", "Giáo trình Toán", DocStatus.ACTIVE,
            "You have been awarded 100 points!"),
        new Case("document-active-no-points", "buildDocumentStatusUpdateEmailHtml",
            "Nguyễn Văn A", "Giáo trình Toán", DocStatus.ACTIVE, "Đã duyệt"),
        new Case("document-rejected", "buildDocumentStatusUpdateEmailHtml",
            "Nguyễn Văn A", "Giáo trình Toán", DocStatus.REJECTED, "Sai nội dung"),
        new Case("document-ai-rejected", "buildDocumentStatusUpdateEmailHtml",
            "Nguyễn Văn A", "Giáo trình Toán", DocStatus.AI_REJECTED, "Ảnh không phù hợp"),
        new Case("document-other-status", "buildDocumentStatusUpdateEmailHtml",
            null, null, DocStatus.PENDING_REVIEW, null),

        // ── role change ──
        new Case("role-change", "buildUserRoleChangeEmailHtml",
            "Nguyễn Văn A", UserRole.READER, UserRole.REVIEWER, "Được đề bạt"),

        // ── org member status: 3 nhánh ──
        new Case("org-member-active", "buildOrganizationMemberStatusUpdateEmailHtml",
            "Nguyễn Văn A", "FPTU", UserStatus.ACTIVE, "Đã kích hoạt"),
        new Case("org-member-inactive", "buildOrganizationMemberStatusUpdateEmailHtml",
            "Nguyễn Văn A", "FPTU", UserStatus.INACTIVE, null),
        new Case("org-member-other", "buildOrganizationMemberStatusUpdateEmailHtml",
            null, null, null, "  ")
    );
  }

  @ParameterizedTest(name = "{0}")
  @MethodSource("cases")
  @DisplayName("HTML của email khớp golden file")
  void matchesGolden(Case c) throws Exception {
    String actual = invoke(c);
    Path golden = GOLDEN.resolve(c.name() + ".html");

    if (!Files.exists(golden)) {
      Files.createDirectories(GOLDEN);
      Files.writeString(golden, actual, StandardCharsets.UTF_8);
      // Lần đầu: tạo golden rồi coi như pass. Lần sau sẽ so sánh thật.
      return;
    }

    assertThat(actual)
        .as("HTML của %s đổi so với golden file. Nếu đổi là CÓ Ý thì xoá "
            + "src/test/resources/email-golden/%s.html rồi chạy lại để tạo golden mới.",
            c.name(), c.name())
        .isEqualTo(Files.readString(golden, StandardCharsets.UTF_8));
  }

  private String invoke(Case c) throws Exception {
    for (Method m : EmailServiceImpl.class.getDeclaredMethods()) {
      if (m.getName().equals(c.method()) && m.getParameterCount() == c.args().length) {
        m.setAccessible(true);
        return (String) m.invoke(service, c.args());
      }
    }
    throw new NoSuchMethodException(
        c.method() + " với " + c.args().length + " tham số");
  }
}
