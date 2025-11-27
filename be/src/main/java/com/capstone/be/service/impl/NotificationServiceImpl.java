package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.Notification;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.NotificationType;
import com.capstone.be.dto.response.user.NotificationResponse;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.mapper.NotificationMapper;
import com.capstone.be.repository.NotificationRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.service.NotificationService;
import com.capstone.be.service.NotificationEventService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Implementation of NotificationService
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

  private final NotificationRepository notificationRepository;
  private final NotificationMapper notificationMapper;
  private final UserRepository userRepository;
  private final NotificationEventService notificationEventService;

  @Override
  @Transactional(readOnly = true)
  public Page<NotificationResponse> getMyNotifications(UUID userId, Pageable pageable) {
    log.info("User {} fetching all notifications with pagination: {}", userId, pageable);

    User user = getUserById(userId);

    return notificationRepository.findByUserOrderByCreatedAtDesc(user, pageable)
        .map(notificationMapper::toResponse);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<NotificationResponse> getMyUnreadNotifications(UUID userId, Pageable pageable) {
    log.info("User {} fetching unread notifications with pagination: {}", userId, pageable);

    User user = getUserById(userId);

    return notificationRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(user, pageable)
        .map(notificationMapper::toResponse);
  }

  @Override
  @Transactional(readOnly = true)
  public long getUnreadCount(UUID userId) {
    log.info("User {} fetching unread notification count", userId);

    User user = getUserById(userId);

    return notificationRepository.countByUserAndIsReadFalse(user);
  }

  @Override
  @Transactional
  public void markAsRead(UUID userId, UUID notificationId) {
    log.info("User {} marking notification {} as read", userId, notificationId);

    Notification notification = notificationRepository.findById(notificationId)
        .orElseThrow(() -> new ResourceNotFoundException(
            "Notification not found with ID: " + notificationId));

    // Verify ownership
    if (!notification.getUser().getId().equals(userId)) {
      throw new ResourceNotFoundException("Notification not found with ID: " + notificationId);
    }

    notification.setIsRead(true);
    notificationRepository.save(notification);

    // Send SSE event for notification update
    NotificationResponse response = notificationMapper.toResponse(notification);
    notificationEventService.sendNotificationUpdated(userId, response);
    
    // Send updated unread count
    long unreadCount = getUnreadCount(userId);
    notificationEventService.sendUnreadCount(userId, unreadCount);

    log.info("Notification {} marked as read successfully", notificationId);
  }

  @Override
  @Transactional
  public int markAllAsRead(UUID userId) {
    log.info("User {} marking all notifications as read", userId);

    int count = notificationRepository.markAllAsReadByUser(userId);

    // Send updated unread count (should be 0 after marking all as read)
    notificationEventService.sendUnreadCount(userId, 0L);

    log.info("Marked {} notifications as read for user {}", count, userId);
    return count;
  }

  @Override
  @Transactional
  public NotificationResponse createNotification(UUID userId, NotificationType type, String title, String summary) {
    log.info("Creating notification for user {}: type={}, title={}", userId, type, title);

    User user = getUserById(userId);

    Notification notification = Notification.builder()
        .user(user)
        .type(type)
        .title(title)
        .summary(summary)
        .isRead(false)
        .build();

    notification = notificationRepository.save(notification);

    // Send SSE event for new notification
    NotificationResponse response = notificationMapper.toResponse(notification);
    notificationEventService.sendNotification(userId, response);
    
    // Send updated unread count
    long unreadCount = getUnreadCount(userId);
    notificationEventService.sendUnreadCount(userId, unreadCount);

    log.info("Notification created successfully for user {}", userId);
    return response;
  }

  /**
   * Helper method to get User entity by ID
   */
  private User getUserById(UUID userId) {
    return userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));
  }
}
