package com.capstone.be.config.seed;

import com.capstone.be.config.seed.event.UserSeededEvent;
import com.capstone.be.domain.entity.Notification;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.NotificationType;
import com.capstone.be.repository.NotificationRepository;
import com.capstone.be.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.DependsOn;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static com.capstone.be.config.seed.SeedUtil.generateUUID;

@Profile("dev")
@Component
@RequiredArgsConstructor
@Slf4j
public class NotificationSeeder {


  private final NotificationRepository notificationRepository;
  private final UserRepository userRepository;

  @Transactional
  @EventListener(UserSeededEvent.class)   //Run after User seeded
  public void seedNotifications() {
    if (notificationRepository.count() > 0) {
      log.info("Notifications already exist, skip NotificationSeeder.");
      return;
    }
    log.info("Seeding notifications...");

    int seed = 0;

    // Get Users
    User systemAdmin     = findUserByEmail("admin@capstone.com");
    User businessAdmin1  = findUserByEmail("business1@capstone.com");
    User businessAdmin2  = findUserByEmail("business2@capstone.com");

    // --- System admin notifications ---
    if (systemAdmin != null) {
      // Welcome
      createNotification(
          seed++,
          systemAdmin,
          NotificationType.SYSTEM,
          "Welcome to the platform!",
          "Thank you for joining us. Explore the features and get started with your first document.",
          false
      );

      // System maintenance
      createNotification(
          seed++,
          systemAdmin,
          NotificationType.SYSTEM,
          "System maintenance scheduled",
          "We will perform system maintenance tonight from 00:00 to 02:00. "
              + "Some features may be temporarily unavailable during this time.",
          false
      );

      // Password changed
      createNotification(
          seed++,
          systemAdmin,
          NotificationType.ACCOUNT,
          "Password changed",
          "Your password has been changed successfully. If this wasn't you, please contact support immediately.",
          true
      );
    }

    // --- Business admin 1 notifications ---
    if (businessAdmin1 != null) {
      // Document uploaded
      createNotification(
          seed++,
          businessAdmin1,
          NotificationType.DOCUMENT,
          "Document uploaded successfully",
          "Your document 'Hướng dẫn sử dụng hệ thống' has been uploaded and is ready for review.",
          false
      );

      // Document approved
      createNotification(
          seed++,
          businessAdmin1,
          NotificationType.SUCCESS,
          "Document approved",
          "Your document 'Quy trình nghiệp vụ chuẩn' has been approved.",
          false
      );

      // Document rejected
      createNotification(
          seed++,
          businessAdmin1,
          NotificationType.ERROR,
          "Document rejected",
          "Your document 'Báo cáo doanh thu quý' has been rejected. "
              + "Reason: Thiếu số liệu chi tiết.",
          false
      );
    }

    // --- Business admin 2 notifications ---
    if (businessAdmin2 != null) {
      // Support ticket received
      createNotification(
          seed++,
          businessAdmin2,
          NotificationType.INFO,
          "Support ticket received",
          "Your support ticket CT-2025-0001 has been received. We'll get back to you soon.",
          false
      );

      // Support ticket responded
      createNotification(
          seed++,
          businessAdmin2,
          NotificationType.INFO,
          "Response to your support ticket",
          "Admin has responded to your support ticket CT-2025-0001. Please check for details.",
          false
      );

      // Profile updated
      createNotification(
          seed++,
          businessAdmin2,
          NotificationType.ACCOUNT,
          "Profile updated",
          "Your profile has been updated successfully.",
          true
      );
    }

    log.info("\uD83C\uDF31 Notification seeding completed. Total notifications: {}", notificationRepository.count());
  }

  private User findUserByEmail(String email) {
    Optional<User> optionalUser = userRepository.findByEmail(email);
    if (optionalUser.isEmpty()) {
      log.warn("Seed user with email '{}' not found. Skipping related notifications.", email);
      return null;
    }
    return optionalUser.get();
  }

  private void createNotification(int seed,
      User user,
      NotificationType type,
      String title,
      String summary,
      boolean isRead) {

    Notification notification = Notification.builder()
        .id(generateUUID("noti-" + seed))
        .user(user)
        .type(type)
        .title(title)
        .summary(summary)
        .isRead(isRead)
        .build();

    notificationRepository.save(notification);
  }
}
