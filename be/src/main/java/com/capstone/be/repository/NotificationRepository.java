package com.capstone.be.repository;

import com.capstone.be.domain.entity.Notification;
import com.capstone.be.domain.entity.User;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

/**
 * Repository for Notification entity
 */
@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

  /**
   * Find all notifications for a user
   */
  Page<Notification> findByUserOrderByCreatedAtDesc(User user, Pageable pageable);

  /**
   * Find unread notifications for a user
   */
  Page<Notification> findByUserAndIsReadFalseOrderByCreatedAtDesc(User user, Pageable pageable);

  /**
   * Count unread notifications for a user
   */
  long countByUserAndIsReadFalse(User user);

  /**
   * Mark all notifications as read for a user
   */
  @Modifying
  @Query("UPDATE Notification n SET n.isRead = true WHERE n.user.id = :userId AND n.isRead = false")
  int markAllAsReadByUser(@Param("userId") UUID userId);
}
