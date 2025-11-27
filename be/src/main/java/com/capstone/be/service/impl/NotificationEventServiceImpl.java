package com.capstone.be.service.impl;

import com.capstone.be.dto.response.user.NotificationResponse;
import com.capstone.be.service.NotificationEventService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.ScheduledFuture;
import java.util.concurrent.TimeUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * Implementation of NotificationEventService for managing SSE connections
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationEventServiceImpl implements NotificationEventService {

  private final ObjectMapper objectMapper;
  
  // Store active SSE connections per user
  private final Map<UUID, SseEmitter> connections = new ConcurrentHashMap<>();
  
  // Store heartbeat tasks per user for cleanup
  private final Map<UUID, ScheduledFuture<?>> heartbeatTasks = new ConcurrentHashMap<>();
  
  // SSE connection timeout (30 minutes)
  private static final long SSE_TIMEOUT = 30 * 60 * 1000L;
  
  // Heartbeat interval (30 seconds)
  private static final long HEARTBEAT_INTERVAL = 30;
  
  // Scheduled executor for heartbeats
  private final ScheduledExecutorService heartbeatExecutor = Executors.newScheduledThreadPool(1);

  @Override
  public SseEmitter createConnection(UUID userId) {
    log.info("Creating SSE connection for user: {}", userId);

    // Remove existing connection if any
    SseEmitter existing = connections.get(userId);
    if (existing != null) {
      cleanupConnection(userId);
      try {
        existing.complete();
      } catch (Exception e) {
        log.warn("Error closing existing SSE connection for user {}: {}", userId, e.getMessage());
      }
    }

    // Create new SSE emitter
    SseEmitter emitter = new SseEmitter(SSE_TIMEOUT);

    // Handle completion
    emitter.onCompletion(() -> {
      log.info("SSE connection completed for user: {}", userId);
      cleanupConnection(userId);
    });

    // Handle timeout
    emitter.onTimeout(() -> {
      log.info("SSE connection timeout for user: {}", userId);
      cleanupConnection(userId);
      try {
        emitter.complete();
      } catch (Exception e) {
        log.warn("Error completing SSE connection on timeout: {}", e.getMessage());
      }
    });

    // Handle error
    emitter.onError((ex) -> {
      log.error("SSE connection error for user {}: {}", userId, ex.getMessage(), ex);
      cleanupConnection(userId);
      try {
        emitter.completeWithError(ex);
      } catch (Exception e) {
        log.warn("Error completing SSE connection with error: {}", e.getMessage());
      }
    });

    connections.put(userId, emitter);

    // Send initial connection message
    try {
      emitter.send(SseEmitter.event()
          .name("connected")
          .data("Connection established"));
    } catch (IOException e) {
      log.error("Failed to send initial connection message to user {}: {}", userId, e.getMessage());
      cleanupConnection(userId);
      emitter.completeWithError(e);
      return emitter;
    }

    // Schedule periodic heartbeat to keep connection alive
    scheduleHeartbeat(userId, emitter);

    log.info("SSE connection created successfully for user: {}", userId);
    return emitter;
  }

  /**
   * Schedule periodic heartbeat for a connection to keep it alive
   */
  private void scheduleHeartbeat(UUID userId, SseEmitter emitter) {
    ScheduledFuture<?> task = heartbeatExecutor.scheduleAtFixedRate(() -> {
      // Check if connection still exists
      if (!connections.containsKey(userId) || connections.get(userId) != emitter) {
        return; // Connection was removed or replaced
      }

      try {
        // Send heartbeat comment (SSE format: starts with :)
        emitter.send(SseEmitter.event()
            .comment("heartbeat"));
        log.trace("Sent heartbeat to user: {}", userId);
      } catch (IOException e) {
        log.warn("Failed to send heartbeat to user {}: {}", userId, e.getMessage());
        // Remove connection if heartbeat fails
        cleanupConnection(userId);
        try {
          emitter.completeWithError(e);
        } catch (Exception ex) {
          log.warn("Error completing emitter after heartbeat failure: {}", ex.getMessage());
        }
      }
    }, HEARTBEAT_INTERVAL, HEARTBEAT_INTERVAL, TimeUnit.SECONDS);
    
    heartbeatTasks.put(userId, task);
  }

  /**
   * Cleanup connection and its heartbeat task
   */
  private void cleanupConnection(UUID userId) {
    connections.remove(userId);
    ScheduledFuture<?> task = heartbeatTasks.remove(userId);
    if (task != null && !task.isCancelled()) {
      task.cancel(false);
    }
  }

  @Override
  public void sendNotification(UUID userId, NotificationResponse notification) {
    SseEmitter emitter = connections.get(userId);
    if (emitter == null) {
      log.debug("No SSE connection found for user: {}", userId);
      return;
    }

    try {
      String json = objectMapper.writeValueAsString(notification);
      emitter.send(SseEmitter.event()
          .name("notification")
          .data(json));
      log.debug("Sent notification event to user: {}", userId);
    } catch (IOException e) {
      log.error("Failed to send notification to user {}: {}", userId, e.getMessage());
      cleanupConnection(userId);
      emitter.completeWithError(e);
    }
  }

  @Override
  public void sendUnreadCount(UUID userId, long count) {
    SseEmitter emitter = connections.get(userId);
    if (emitter == null) {
      log.debug("No SSE connection found for user: {}", userId);
      return;
    }

    try {
      String json = objectMapper.writeValueAsString(Map.of("count", count));
      emitter.send(SseEmitter.event()
          .name("unread-count")
          .data(json));
      log.debug("Sent unread count update to user: {} (count: {})", userId, count);
    } catch (IOException e) {
      log.error("Failed to send unread count to user {}: {}", userId, e.getMessage());
      cleanupConnection(userId);
      emitter.completeWithError(e);
    }
  }

  @Override
  public void sendNotificationUpdated(UUID userId, NotificationResponse notification) {
    SseEmitter emitter = connections.get(userId);
    if (emitter == null) {
      log.debug("No SSE connection found for user: {}", userId);
      return;
    }

    try {
      String json = objectMapper.writeValueAsString(notification);
      emitter.send(SseEmitter.event()
          .name("updated")
          .data(json));
      log.debug("Sent notification updated event to user: {}", userId);
    } catch (IOException e) {
      log.error("Failed to send notification updated to user {}: {}", userId, e.getMessage());
      cleanupConnection(userId);
      emitter.completeWithError(e);
    }
  }

  @Override
  public void removeConnection(UUID userId) {
    SseEmitter emitter = connections.get(userId);
    if (emitter != null) {
      cleanupConnection(userId);
      try {
        emitter.complete();
      } catch (Exception e) {
        log.warn("Error completing SSE connection for user {}: {}", userId, e.getMessage());
      }
      log.info("Removed SSE connection for user: {}", userId);
    }
  }
}

