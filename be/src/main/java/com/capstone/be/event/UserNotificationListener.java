package com.capstone.be.event;

import com.capstone.be.domain.entity.OrgEnrollment;
import com.capstone.be.domain.entity.OrganizationProfile;
import com.capstone.be.domain.enums.OrgEnrollStatus;
import com.capstone.be.repository.OrgEnrollmentRepository;
import com.capstone.be.repository.OrganizationProfileRepository;
import com.capstone.be.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Gửi email thông báo khi trạng thái hoặc vai trò người dùng đổi.
 *
 * <p>Trước đây bốn việc này nằm trong thân {@code UserServiceImpl}, mỗi chỗ bọc
 * try/catch kèm comment "best-effort" — tức là chúng vốn đã không thuộc luồng nghiệp
 * vụ, chỉ chưa được tách ra.
 *
 * <p>{@code AFTER_COMMIT} sửa hai việc:
 *
 * <ul>
 *   <li>Email không còn gửi khi thay đổi chưa chắc đã được ghi. Trước đây transaction
 *       rollback sau đó thì người dùng vẫn đã nhận mail.
 *   <li>Quan trọng hơn: việc gửi cho TOÀN BỘ thành viên tổ chức là một vòng lặp phân
 *       trang, trước đây chạy ngay trong transaction ghi — giữ connection và lock suốt
 *       hàng trăm lần gọi SMTP. Giờ nó ra ngoài.
 * </ul>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class UserNotificationListener {

  private final EmailService emailService;
  private final OrganizationProfileRepository organizationProfileRepository;
  private final OrgEnrollmentRepository orgEnrollmentRepository;

  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  public void onUserStatusChanged(UserStatusChangedEvent event) {
    try {
      emailService.sendUserStatusUpdateEmail(
          event.email(), event.fullName(), event.newStatus(), event.reason());
    } catch (Exception e) {
      log.warn("Failed to send user status update email for user {}: {}",
          event.userId(), e.getMessage());
    }
  }

  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  public void onUserRoleChanged(UserRoleChangedEvent event) {
    try {
      emailService.sendUserRoleChangeEmail(
          event.email(), event.fullName(), event.oldRole(), event.newRole(), event.reason());
    } catch (Exception e) {
      log.warn("Failed to send user role change email for user {}: {}",
          event.userId(), e.getMessage());
    }
  }

  /**
   * Thông báo cho admin tổ chức và mọi thành viên đã JOINED.
   *
   * <p>{@code REQUIRES_NEW} là bắt buộc: listener chạy sau khi transaction gốc đã
   * commit, nên phải mở transaction riêng để đọc enrollment (quan hệ lazy).
   */
  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  @Transactional(propagation = Propagation.REQUIRES_NEW, readOnly = true)
  public void onOrganizationStatusChanged(OrganizationStatusChangedEvent event) {
    try {
      emailService.sendOrganizationStatusUpdateEmail(
          event.adminEmail(), event.adminFullName(), event.newStatus(), event.reason());
    } catch (Exception e) {
      log.warn("Failed to send organization status update email for admin {}: {}",
          event.adminUserId(), e.getMessage());
    }

    notifyOrganizationMembers(event);
  }

  /** Chuyển nguyên văn từ UserServiceImpl.notifyOrganizationMembers, chỉ đổi tham số đầu. */
  private void notifyOrganizationMembers(OrganizationStatusChangedEvent event) {
    try {
      OrganizationProfile organization = organizationProfileRepository
          .findByAdminId(event.adminUserId())
          .orElse(null);

      if (organization == null) {
        log.warn("Organization profile not found for admin: {}", event.adminUserId());
        return;
      }

      int pageSize = 100;
      int page = 0;
      boolean hasMore = true;
      int totalNotified = 0;

      while (hasMore) {
        Pageable pageable = PageRequest.of(page, pageSize);

        Page<OrgEnrollment> enrollments =
            orgEnrollmentRepository.findByOrganizationAndStatus(
                organization,
                OrgEnrollStatus.JOINED,
                pageable
            );

        for (OrgEnrollment enrollment : enrollments.getContent()) {
          if (enrollment.getMember() != null && enrollment.getMember().getEmail() != null) {
            try {
              emailService.sendOrganizationMemberStatusUpdateEmail(
                  enrollment.getMember().getEmail(),
                  enrollment.getMember().getFullName(),
                  organization.getName(),
                  event.newStatus(),
                  event.reason()
              );
              totalNotified++;
            } catch (Exception e) {
              log.warn("Failed to send organization member status update email to {}: {}",
                  enrollment.getMember().getEmail(), e.getMessage());
            }
          }
        }

        hasMore = enrollments.hasNext();
        page++;
      }

      log.info("Notified {} organization members about status change for organization: {}",
          totalNotified, organization.getName());

    } catch (Exception e) {
      log.warn("Failed to notify organization members about status change: {}", e.getMessage());
    }
  }
}
