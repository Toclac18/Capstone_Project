package com.capstone.be.service.helper;

import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.NotificationType;
import com.capstone.be.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
}
