package com.capstone.be.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.capstone.be.domain.entity.Notification;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.NotificationType;
import com.capstone.be.dto.response.user.NotificationResponse;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.mapper.NotificationMapper;
import com.capstone.be.repository.NotificationRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.service.NotificationEventService;
import com.capstone.be.service.impl.NotificationServiceImpl;
import java.time.Instant;
import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationService Unit Tests")
class NotificationServiceTest {

  @Mock
  private NotificationRepository notificationRepository;

  @Mock
  private UserRepository userRepository;

  @Mock
  private NotificationMapper notificationMapper;

  @Mock
  private NotificationEventService notificationEventService;

  @InjectMocks
  private NotificationServiceImpl notificationService;

  private User user;
  private Notification notification1;
  private Notification notification2;
  private UUID userId;
  private UUID notificationId1;
  private UUID notificationId2;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    notificationId1 = UUID.randomUUID();
    notificationId2 = UUID.randomUUID();

    user = User.builder()
        .id(userId)
        .email("user@example.com")
        .fullName("Test User")
        .build();

    notification1 = Notification.builder()
        .id(notificationId1)
        .user(user)
        .type(NotificationType.DOCUMENT)
        .title("Document Approved")
        .summary("Your document has been approved")
        .isRead(false)
        .createdAt(Instant.now())
        .updatedAt(Instant.now())
        .build();

    notification2 = Notification.builder()
        .id(notificationId2)
        .user(user)
        .type(NotificationType.DOCUMENT)
        .title("Review Request")
        .summary("You have a new review request")
        .isRead(true)
        .createdAt(Instant.now())
        .updatedAt(Instant.now())
        .build();
  }

  // test getMyNotifications should return paginated notifications
  @Test
  @DisplayName("getMyNotifications should return paginated notifications")
  void getMyNotifications_ShouldReturnPaginatedNotifications() {
    Pageable pageable = PageRequest.of(0, 10);
    Page<Notification> notificationPage = new PageImpl<>(
        Arrays.asList(notification1, notification2), pageable, 2);

    NotificationResponse response1 = NotificationResponse.builder()
        .id(notificationId1)
        .title("Document Approved")
        .summary("Your document has been approved")
        .isRead(false)
        .build();

    NotificationResponse response2 = NotificationResponse.builder()
        .id(notificationId2)
        .title("Review Request")
        .summary("You have a new review request")
        .isRead(true)
        .build();

    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(notificationRepository.findByUserOrderByCreatedAtDesc(user, pageable))
        .thenReturn(notificationPage);
    when(notificationMapper.toResponse(notification1)).thenReturn(response1);
    when(notificationMapper.toResponse(notification2)).thenReturn(response2);

    Page<NotificationResponse> result = notificationService.getMyNotifications(userId, pageable);

    assertNotNull(result);
    assertEquals(2, result.getTotalElements());
    verify(notificationRepository, times(1))
        .findByUserOrderByCreatedAtDesc(user, pageable);
  }

  // test getMyUnreadNotifications should return only unread notifications
  @Test
  @DisplayName("getMyUnreadNotifications should return only unread notifications")
  void getMyUnreadNotifications_ShouldReturnUnreadOnly() {
    Pageable pageable = PageRequest.of(0, 10);
    Page<Notification> notificationPage = new PageImpl<>(
        Arrays.asList(notification1), pageable, 1);

    NotificationResponse response1 = NotificationResponse.builder()
        .id(notificationId1)
        .title("Document Approved")
        .isRead(false)
        .build();

    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(notificationRepository.findByUserAndIsReadFalseOrderByCreatedAtDesc(user, pageable))
        .thenReturn(notificationPage);
    when(notificationMapper.toResponse(notification1)).thenReturn(response1);

    Page<NotificationResponse> result =
        notificationService.getMyUnreadNotifications(userId, pageable);

    assertEquals(1, result.getTotalElements());
    assertEquals(false, result.getContent().get(0).getIsRead());
  }

  // test getUnreadCount should return count of unread notifications
  @Test
  @DisplayName("getUnreadCount should return count of unread notifications")
  void getUnreadCount_ShouldReturnCount() {
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(notificationRepository.countByUserAndIsReadFalse(user)).thenReturn(5L);

    long result = notificationService.getUnreadCount(userId);

    assertEquals(5L, result);
    verify(notificationRepository, times(1)).countByUserAndIsReadFalse(user);
  }

  // test markAsRead should mark notification as read
  @Test
  @DisplayName("markAsRead should mark notification as read")
  void markAsRead_ShouldMarkAsRead() {
    NotificationResponse response = NotificationResponse.builder()
        .id(notificationId1)
        .title("Document Approved")
        .isRead(false)
        .build();

    when(notificationRepository.findById(notificationId1)).thenReturn(Optional.of(notification1));
    when(notificationMapper.toResponse(notification1)).thenReturn(response);
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(notificationRepository.countByUserAndIsReadFalse(user)).thenReturn(0L);

    notificationService.markAsRead(userId, notificationId1);

    verify(notificationRepository, times(1)).findById(notificationId1);
    verify(notificationRepository, times(1)).save(any(Notification.class));
  }

  // test markAsRead should throw exception when notification not found
  @Test
  @DisplayName("markAsRead should throw exception when notification not found")
  void markAsRead_ShouldThrowException_WhenNotFound() {
    UUID nonExistentId = UUID.randomUUID();
    when(notificationRepository.findById(nonExistentId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> notificationService.markAsRead(userId, nonExistentId));
    verify(notificationRepository, never()).save(any());
  }

  // test markAsRead should throw exception when not owner
  @Test
  @DisplayName("markAsRead should throw exception when not owner")
  void markAsRead_ShouldThrowException_WhenNotOwner() {
    UUID otherUserId = UUID.randomUUID();
    Notification otherNotification = Notification.builder()
        .id(notificationId1)
        .user(User.builder().id(otherUserId).build())
        .build();

    when(notificationRepository.findById(notificationId1))
        .thenReturn(Optional.of(otherNotification));

    assertThrows(ResourceNotFoundException.class,
        () -> notificationService.markAsRead(userId, notificationId1));
    verify(notificationRepository, never()).save(any());
  }

  // test markAllAsRead should mark all notifications as read
  @Test
  @DisplayName("markAllAsRead should mark all notifications as read")
  void markAllAsRead_ShouldMarkAllAsRead() {
    when(notificationRepository.markAllAsReadByUser(userId)).thenReturn(1);

    int result = notificationService.markAllAsRead(userId);

    assertEquals(1, result);
    verify(notificationRepository, times(1)).markAllAsReadByUser(userId);
  }

  // test createNotification should create notification
  @Test
  @DisplayName("createNotification should create notification")
  void createNotification_ShouldCreateNotification() {
    Notification newNotification = Notification.builder()
        .id(notificationId1)
        .user(user)
        .type(NotificationType.DOCUMENT)
        .title("New Notification")
        .summary("Notification summary")
        .isRead(false)
        .build();

    NotificationResponse response = NotificationResponse.builder()
        .id(notificationId1)
        .title("New Notification")
        .summary("Notification summary")
        .isRead(false)
        .build();

    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(notificationRepository.save(any(Notification.class))).thenReturn(newNotification);
    when(notificationMapper.toResponse(newNotification)).thenReturn(response);

    NotificationResponse result = notificationService.createNotification(
        userId, NotificationType.DOCUMENT, "New Notification", "Notification summary");

    assertNotNull(result);
    assertEquals("New Notification", result.getTitle());
    verify(notificationRepository, times(1)).save(any(Notification.class));
  }

  // test createNotification should throw exception when user not found
  @Test
  @DisplayName("createNotification should throw exception when user not found")
  void createNotification_ShouldThrowException_WhenUserNotFound() {
    UUID nonExistentUserId = UUID.randomUUID();
    when(userRepository.findById(nonExistentUserId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> notificationService.createNotification(
            nonExistentUserId, NotificationType.DOCUMENT, "Title", "Summary"));
    verify(notificationRepository, never()).save(any());
  }
}

