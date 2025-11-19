package com.capstone.be.controller;

import com.capstone.be.dto.common.PagedResponse;
import com.capstone.be.dto.response.user.NotificationResponse;
import com.capstone.be.security.model.UserPrincipal;
import com.capstone.be.service.NotificationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for notification operations
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
@Tag(name = "Notifications", description = "APIs for user notifications")
public class NotificationController {

  private final NotificationService notificationService;

  /**
   * Get all notifications for current user
   * GET /api/v1/notifications
   *
   * @param principal  Current authenticated user
   * @param unreadOnly Optional filter to get only unread notifications
   * @param pageable   Pagination parameters
   * @return Page of notifications
   */
  @GetMapping
  @PreAuthorize("isAuthenticated()")
  @Operation(summary = "Get my notifications",
             description = "Get notifications for current user with optional unread filter")
  public ResponseEntity<PagedResponse<NotificationResponse>> getMyNotifications(
      @AuthenticationPrincipal UserPrincipal principal,
      @RequestParam(name = "unreadOnly", required = false, defaultValue = "false") Boolean unreadOnly,
      @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

    UUID userId = principal.getId();
    log.info("User {} fetching notifications - unreadOnly: {}, pagination: {}",
        userId, unreadOnly, pageable);

    Page<NotificationResponse> page;

    if (Boolean.TRUE.equals(unreadOnly)) {
      page = notificationService.getMyUnreadNotifications(userId, pageable);
    } else {
      page = notificationService.getMyNotifications(userId, pageable);
    }

    return ResponseEntity.ok(PagedResponse.of(page));
  }

  /**
   * Get unread notification count
   * GET /api/v1/notifications/unread-count
   *
   * @param principal Current authenticated user
   * @return Unread count
   */
  @GetMapping("/unread-count")
  @PreAuthorize("isAuthenticated()")
  @Operation(summary = "Get unread count", description = "Get count of unread notifications")
  public ResponseEntity<Map<String, Long>> getUnreadCount(
      @AuthenticationPrincipal UserPrincipal principal) {

    UUID userId = principal.getId();
    log.info("User {} fetching unread notification count", userId);

    long count = notificationService.getUnreadCount(userId);

    return ResponseEntity.ok(Map.of("count", count));
  }

  /**
   * Mark a notification as read
   * PATCH /api/v1/notifications/{notificationId}/read
   *
   * @param principal      Current authenticated user
   * @param notificationId Notification ID
   * @return No content
   */
  @PatchMapping("/{notificationId}/read")
  @PreAuthorize("isAuthenticated()")
  @Operation(summary = "Mark as read", description = "Mark a notification as read")
  public ResponseEntity<Void> markAsRead(
      @AuthenticationPrincipal UserPrincipal principal,
      @PathVariable(name = "notificationId") UUID notificationId) {

    UUID userId = principal.getId();
    log.info("User {} marking notification {} as read", userId, notificationId);

    notificationService.markAsRead(userId, notificationId);

    return ResponseEntity.noContent().build();
  }

  /**
   * Mark all notifications as read
   * PATCH /api/v1/notifications/read-all
   *
   * @param principal Current authenticated user
   * @return Number of notifications marked as read
   */
  @PatchMapping("/read-all")
  @PreAuthorize("isAuthenticated()")
  @Operation(summary = "Mark all as read", description = "Mark all notifications as read")
  public ResponseEntity<Map<String, Integer>> markAllAsRead(
      @AuthenticationPrincipal UserPrincipal principal) {

    UUID userId = principal.getId();
    log.info("User {} marking all notifications as read", userId);

    int count = notificationService.markAllAsRead(userId);

    return ResponseEntity.ok(Map.of("count", count));
  }
}
