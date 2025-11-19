package com.capstone.be.domain.enums;

/**
 * Types of notifications that can be sent to users
 */
public enum NotificationType {
  /**
   * System-related notifications (maintenance, updates, etc.)
   */
  SYSTEM,

  /**
   * Document-related notifications (new document, review, approval, etc.)
   */
  DOCUMENT,

  /**
   * User account notifications (password change, profile update, etc.)
   */
  ACCOUNT,

  /**
   * General information notifications
   */
  INFO,

  /**
   * Warning notifications
   */
  WARNING,

  /**
   * Success notifications
   */
  SUCCESS,

  /**
   * Error notifications
   */
  ERROR
}
