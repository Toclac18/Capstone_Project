package com.capstone.be.service.helper;

import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.NotificationType;
import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.domain.enums.UserStatus;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.repository.specification.UserSpecification;
import com.capstone.be.service.NotificationService;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Component;

/**
 * Helper class for creating system notifications
 * Use this to send notifications to users from various parts of the application
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationHelper {

  private final NotificationService notificationService;
  private final UserRepository userRepository;

  /**
   * Send a welcome notification to a new user
   */
  public void sendWelcomeNotification(User user) {
    notificationService.createNotification(
        user.getId(),
        NotificationType.SYSTEM,
        "Welcome to the platform!",
        "Thank you for joining us. Explore the features and get started with your first document."
    );
  }

  /**
   * Send a document uploaded notification
   */
  public void sendDocumentUploadedNotification(User user, String documentName) {
    notificationService.createNotification(
        user.getId(),
        NotificationType.DOCUMENT,
        "Document uploaded successfully",
        String.format("Your document '%s' has been uploaded and is ready for review.", documentName)
    );
  }

  /**
   * Send a document approved notification
   */
  public void sendDocumentApprovedNotification(User user, String documentName) {
    notificationService.createNotification(
        user.getId(),
        NotificationType.SUCCESS,
        "Document approved",
        String.format("Your document '%s' has been approved.", documentName)
    );
  }

  /**
   * Send a document rejected notification
   */
  public void sendDocumentRejectedNotification(User user, String documentName, String reason) {
    notificationService.createNotification(
        user.getId(),
        NotificationType.WARNING,
        "Document rejected",
        String.format("Your document '%s' has been rejected. Reason: %s", documentName, reason)
    );
  }

  /**
   * Send a password changed notification
   */
  public void sendPasswordChangedNotification(User user) {
    notificationService.createNotification(
        user.getId(),
        NotificationType.ACCOUNT,
        "Password changed",
        "Your password has been changed successfully. If this wasn't you, please contact support immediately."
    );
  }

  /**
   * Send a profile updated notification
   */
  public void sendProfileUpdatedNotification(User user) {
    notificationService.createNotification(
        user.getId(),
        NotificationType.ACCOUNT,
        "Profile updated",
        "Your profile has been updated successfully."
    );
  }

  /**
   * Send a system maintenance notification
   */
  public void sendMaintenanceNotification(User user, String maintenanceDate) {
    notificationService.createNotification(
        user.getId(),
        NotificationType.SYSTEM,
        "Scheduled maintenance",
        String.format("System maintenance is scheduled for %s. The platform may be temporarily unavailable.",
            maintenanceDate)
    );
  }

  /**
   * Send a contact ticket received notification
   */
  public void sendContactTicketReceivedNotification(User user, String ticketCode) {
    notificationService.createNotification(
        user.getId(),
        NotificationType.INFO,
        "Support ticket received",
        String.format("Your support ticket %s has been received. We'll get back to you soon.",
            ticketCode)
    );
  }

  /**
   * Send a contact ticket response notification
   */
  public void sendContactTicketResponseNotification(User user, String ticketCode) {
    notificationService.createNotification(
        user.getId(),
        NotificationType.INFO,
        "Response to your support ticket",
        String.format("Admin has responded to your support ticket %s. Please check for details.",
            ticketCode)
    );
  }

  /**
   * Send a generic notification
   */
  public void sendNotification(User user, NotificationType type, String title, String summary) {
    notificationService.createNotification(user.getId(), type, title, summary);
  }

  // ========== Admin Notification Methods ==========

  /**
   * Send notification to all admin users (ORGANIZATION_ADMIN, BUSINESS_ADMIN, SYSTEM_ADMIN)
   * Only sends to ACTIVE admins
   *
   * @param type    Notification type
   * @param title   Notification title
   * @param summary Notification summary
   */
  public void sendNotificationToAllAdmins(NotificationType type, String title, String summary) {
    List<UserRole> adminRoles = Arrays.asList(
        UserRole.ORGANIZATION_ADMIN,
        UserRole.BUSINESS_ADMIN,
        UserRole.SYSTEM_ADMIN
    );

    Specification<User> spec = Specification
        .where(UserSpecification.hasAnyRole(adminRoles))
        .and(UserSpecification.hasStatus(UserStatus.ACTIVE));

    List<User> adminUsers = userRepository.findAll(spec);

    log.info("Sending notification to {} admin users: {}", adminUsers.size(), title);

    for (User admin : adminUsers) {
      try {
        notificationService.createNotification(admin.getId(), type, title, summary);
        log.debug("Sent notification to admin: {}", admin.getEmail());
      } catch (Exception e) {
        log.error("Failed to send notification to admin {}: {}", admin.getEmail(), e.getMessage());
      }
    }
  }

  /**
   * Send notification to ORGANIZATION_ADMIN users only
   * Only sends to ACTIVE admins
   *
   * @param type    Notification type
   * @param title   Notification title
   * @param summary Notification summary
   */
  public void sendNotificationToOrganizationAdmins(NotificationType type, String title, String summary) {
    Specification<User> spec = Specification
        .where(UserSpecification.hasRole(UserRole.ORGANIZATION_ADMIN))
        .and(UserSpecification.hasStatus(UserStatus.ACTIVE));

    List<User> orgAdmins = userRepository.findAll(spec);

    log.info("Sending notification to {} organization admins: {}", orgAdmins.size(), title);

    for (User admin : orgAdmins) {
      try {
        notificationService.createNotification(admin.getId(), type, title, summary);
        log.debug("Sent notification to organization admin: {}", admin.getEmail());
      } catch (Exception e) {
        log.error("Failed to send notification to organization admin {}: {}", admin.getEmail(), e.getMessage());
      }
    }
  }

  /**
   * Send notification to BUSINESS_ADMIN and SYSTEM_ADMIN users only
   * Only sends to ACTIVE admins
   *
   * @param type    Notification type
   * @param title   Notification title
   * @param summary Notification summary
   */
  public void sendNotificationToSystemAdmins(NotificationType type, String title, String summary) {
    List<UserRole> systemAdminRoles = Arrays.asList(
        UserRole.BUSINESS_ADMIN,
        UserRole.SYSTEM_ADMIN
    );

    Specification<User> spec = Specification
        .where(UserSpecification.hasAnyRole(systemAdminRoles))
        .and(UserSpecification.hasStatus(UserStatus.ACTIVE));

    List<User> systemAdmins = userRepository.findAll(spec);

    log.info("Sending notification to {} system admins: {}", systemAdmins.size(), title);

    for (User admin : systemAdmins) {
      try {
        notificationService.createNotification(admin.getId(), type, title, summary);
        log.debug("Sent notification to system admin: {}", admin.getEmail());
      } catch (Exception e) {
        log.error("Failed to send notification to system admin {}: {}", admin.getEmail(), e.getMessage());
      }
    }
  }

  /**
   * Send notification to BUSINESS_ADMIN users only
   * Only sends to ACTIVE admins
   *
   * @param type    Notification type
   * @param title   Notification title
   * @param summary Notification summary
   */
  public void sendNotificationToBusinessAdmins(NotificationType type, String title, String summary) {
    Specification<User> spec = Specification
        .where(UserSpecification.hasRole(UserRole.BUSINESS_ADMIN))
        .and(UserSpecification.hasStatus(UserStatus.ACTIVE));

    List<User> businessAdmins = userRepository.findAll(spec);

    log.info("Sending notification to {} business admins: {}", businessAdmins.size(), title);

    for (User admin : businessAdmins) {
      try {
        notificationService.createNotification(admin.getId(), type, title, summary);
        log.debug("Sent notification to business admin: {}", admin.getEmail());
      } catch (Exception e) {
        log.error("Failed to send notification to business admin {}: {}", admin.getEmail(), e.getMessage());
      }
    }
  }

  /**
   * Send notification to a specific organization admin
   * Useful when you know the organization ID and want to notify its admin
   *
   * @param organizationId Organization ID
   * @param type            Notification type
   * @param title           Notification title
   * @param summary         Notification summary
   */
  public void sendNotificationToOrganizationAdmin(UUID organizationId, NotificationType type, String title, String summary) {
    // This would require OrganizationProfileRepository to find the admin
    // For now, this is a placeholder - implement based on your needs
    log.warn("sendNotificationToOrganizationAdmin not yet implemented for organizationId: {}", organizationId);
  }
}
