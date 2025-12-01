package com.capstone.be.config.seed;

import com.capstone.be.domain.entity.SystemConfig;
import com.capstone.be.repository.SystemConfigRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Seeder for System Config (dev profile only)
 * Seeds default system configurations
 */
@Profile("dev")
@Component
@RequiredArgsConstructor
@Slf4j
public class SystemConfigSeeder {

  private final SystemConfigRepository systemConfigRepository;

  @Transactional
  @EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
  public void run() {
    if (systemConfigRepository.count() > 0) {
      log.warn("System configs already exist → skip seeding.");
      return;
    }

    log.info("Starting System Config seeding...");

    // ========== DOCUMENT SETTINGS ==========
    createConfig("document.defaultPremiumPrice", "120", "Default price for premium documents (points)", "NUMBER", true);
    createConfig("document.maxFileSizeMB", "50", "Maximum file size for document upload (MB)", "NUMBER", true);
    createConfig("document.maxUploadsPerDay", "10", "Maximum number of documents a user can upload per day", "NUMBER", true);
    createConfig("document.allowedFileTypes", "pdf,doc,docx,ppt,pptx,xls,xlsx", "Allowed file types for upload (comma-separated)", "STRING", true);
    createConfig("document.autoApproveEnabled", "false", "Auto-approve documents without reviewer (for testing)", "BOOLEAN", true);
    createConfig("document.minTitleLength", "5", "Minimum title length for documents", "NUMBER", true);
    createConfig("document.maxTitleLength", "200", "Maximum title length for documents", "NUMBER", true);
    createConfig("document.minDescriptionLength", "10", "Minimum description length for documents", "NUMBER", true);
    createConfig("document.maxDescriptionLength", "2000", "Maximum description length for documents", "NUMBER", true);

    // ========== SYSTEM SETTINGS ==========
    createConfig("system.maintenanceMode", "false", "Enable/disable system maintenance mode (blocks all user actions)", "BOOLEAN", true);
    createConfig("system.maintenanceMessage", "System is under maintenance. Please try again later.", "Message shown during maintenance mode", "STRING", true);
    createConfig("system.maxUsersPerOrganization", "1000", "Maximum number of users per organization", "NUMBER", true);
    createConfig("system.sessionTimeoutMinutes", "30", "User session timeout in minutes (inactivity)", "NUMBER", true);
    createConfig("system.maxLoginAttempts", "5", "Maximum failed login attempts before account lockout", "NUMBER", true);
    createConfig("system.lockoutDurationMinutes", "15", "Account lockout duration in minutes after max attempts", "NUMBER", true);

    // ========== REVIEW SETTINGS ==========
    createConfig("review.autoRejectDays", "7", "Auto-reject documents if not reviewed within X days", "NUMBER", true);
    createConfig("review.requireReviewerApproval", "true", "Require reviewer approval before document publication", "BOOLEAN", true);
    createConfig("review.maxReviewersPerDocument", "3", "Maximum number of reviewers assigned per document", "NUMBER", true);

    // ========== POINT SYSTEM SETTINGS ==========
    createConfig("points.uploadReward", "10", "Points rewarded for uploading a document", "NUMBER", true);
    createConfig("points.reviewReward", "20", "Points rewarded for reviewing a document", "NUMBER", true);
    createConfig("points.premiumPurchaseCost", "120", "Points cost to purchase a premium document", "NUMBER", true);
    createConfig("points.initialBalance", "100", "Initial points balance for new users", "NUMBER", true);

    // ========== AUDIT LOG SETTINGS ==========
    createConfig("audit.log.retentionDays", "180", "Number of days to retain audit logs (6 months)", "NUMBER", true);
    createConfig("audit.log.retentionEnabled", "true", "Enable/disable automatic audit log retention", "BOOLEAN", true);
    createConfig("audit.log.maxLogsPerUser", "10000", "Maximum audit logs stored per user", "NUMBER", true);

    // ========== EMAIL SETTINGS ==========
    createConfig("email.verificationRequired", "true", "Require email verification for new user registration", "BOOLEAN", true);
    createConfig("email.maxResendAttempts", "3", "Maximum email verification resend attempts per hour", "NUMBER", true);
    createConfig("email.verificationExpiryHours", "24", "Email verification link expiry time in hours", "NUMBER", true);
    createConfig("email.notificationEnabled", "true", "Enable/disable email notifications", "BOOLEAN", true);

    // ========== ORGANIZATION SETTINGS ==========
    createConfig("organization.autoApproveEnabled", "false", "Auto-approve new organization registrations", "BOOLEAN", true);
    createConfig("organization.maxDocumentsPerOrg", "10000", "Maximum documents an organization can have", "NUMBER", true);
    createConfig("organization.requireVerification", "true", "Require organization email verification", "BOOLEAN", true);

    // ========== SEARCH SETTINGS ==========
    createConfig("search.maxResultsPerPage", "20", "Maximum search results per page", "NUMBER", true);
    createConfig("search.enableAdvancedSearch", "true", "Enable advanced search features", "BOOLEAN", true);
    createConfig("search.minQueryLength", "2", "Minimum search query length", "NUMBER", true);

    // ========== SECURITY SETTINGS ==========
    createConfig("security.passwordMinLength", "8", "Minimum password length", "NUMBER", true);
    createConfig("security.passwordRequireUppercase", "true", "Require uppercase letter in password", "BOOLEAN", true);
    createConfig("security.passwordRequireNumber", "true", "Require number in password", "BOOLEAN", true);
    createConfig("security.passwordRequireSpecialChar", "false", "Require special character in password", "BOOLEAN", true);
    createConfig("security.enableTwoFactorAuth", "false", "Enable two-factor authentication (future feature)", "BOOLEAN", true);

    // ========== NOTIFICATION SETTINGS ==========
    createConfig("notification.maxUnreadNotifications", "100", "Maximum unread notifications per user", "NUMBER", true);
    createConfig("notification.autoDeleteDays", "30", "Auto-delete notifications older than X days", "NUMBER", true);
    createConfig("notification.enablePushNotifications", "false", "Enable browser push notifications (future feature)", "BOOLEAN", true);

    log.info("Seeded {} System Configs successfully.", systemConfigRepository.count());
  }

  private void createConfig(String key, String value, String description, String type, boolean editable) {
    SystemConfig config = SystemConfig.builder()
        .id(SeedUtil.generateUUID("config-" + key.replace(".", "-")))
        .configKey(key)
        .configValue(value)
        .description(description)
        .configType(type)
        .isEditable(editable)
        .build();

    systemConfigRepository.save(config);
    log.debug("Created system config: key={}, value={}", key, value);
  }
}

