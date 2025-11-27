package com.capstone.be.service;

import com.capstone.be.dto.response.user.NotificationResponse;
import java.util.UUID;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * Service for managing Server-Sent Events (SSE) for notifications
 */
public interface NotificationEventService {

  /**
   * Create a new SSE connection for a user
   *
   * @param userId User ID
   * @return SseEmitter for the connection
   */
  SseEmitter createConnection(UUID userId);

  /**
   * Send a new notification event to a user
   *
   * @param userId     Target user ID
   * @param notification Notification data
   */
  void sendNotification(UUID userId, NotificationResponse notification);

  /**
   * Send unread count update to a user
   *
   * @param userId Target user ID
   * @param count  New unread count
   */
  void sendUnreadCount(UUID userId, long count);

  /**
   * Send notification updated event (e.g., marked as read)
   *
   * @param userId     Target user ID
   * @param notification Updated notification data
   */
  void sendNotificationUpdated(UUID userId, NotificationResponse notification);

  /**
   * Remove SSE connection for a user
   *
   * @param userId User ID
   */
  void removeConnection(UUID userId);
}

