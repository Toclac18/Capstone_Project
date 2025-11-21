package com.capstone.be.service;

import com.capstone.be.domain.enums.NotificationType;
import com.capstone.be.dto.response.user.NotificationResponse;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service interface for notification operations
 */
public interface NotificationService {

  /**
   * Get all notifications for a user
   *
   * @param userId   Target user ID
   * @param pageable Pagination parameters
   * @return Page of notifications
   */
  Page<NotificationResponse> getMyNotifications(UUID userId, Pageable pageable);

  /**
   * Get unread notifications for a user
   *
   * @param userId   Target user ID
   * @param pageable Pagination parameters
   * @return Page of unread notifications
   */
  Page<NotificationResponse> getMyUnreadNotifications(UUID userId, Pageable pageable);

  /**
   * Get unread notification count for a user
   *
   * @param userId Target user ID
   * @return Count of unread notifications
   */
  long getUnreadCount(UUID userId);

  /**
   * Mark a notification as read
   *
   * @param userId         Current user ID
   * @param notificationId Notification ID
   */
  void markAsRead(UUID userId, UUID notificationId);

  /**
   * Mark all notifications as read for a user
   *
   * @param userId Target user
   * @return Number of notifications marked as read
   */
  int markAllAsRead(UUID userId);

  /**
   * Create a notification for a user (system-generated)
   *
   * @param userId  Target user ID
   * @param type    Notification type
   * @param title   Notification title
   * @param summary Notification summary
   */
  void createNotification(UUID userId, NotificationType type, String title, String summary);
}
