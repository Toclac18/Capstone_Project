package com.capstone.be.exception;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Centralized error codes for the application
 */
@Getter
@AllArgsConstructor
public enum ErrorCode {

  // General errors (1xxx)
  INTERNAL_SERVER_ERROR("1000", "Internal server error"),
  INVALID_REQUEST("1001", "Invalid request"),
  VALIDATION_ERROR("1002", "Validation error"),
  METHOD_NOT_ALLOWED("1003", "Method not allowed"),
  UNSUPPORTED_MEDIA_TYPE("1004", "Unsupported media type"),

  // Authentication & Authorization errors (2xxx)
  UNAUTHORIZED("2000", "Unauthorized"),
  INVALID_CREDENTIALS("2001", "Invalid email or password"),
  TOKEN_EXPIRED("2002", "Token has expired"),
  TOKEN_INVALID("2003", "Invalid token"),
  FORBIDDEN("2004", "Access forbidden"),
  ACCOUNT_DISABLED("2005", "Account is disabled"),
  ACCOUNT_LOCKED("2006", "Account is locked"),
  EMAIL_NOT_VERIFIED("2007", "Email not verified"),
  ACCOUNT_PENDING_APPROVAL("2008", "Account is pending approval"),

  // Resource errors (3xxx)
  RESOURCE_NOT_FOUND("3000", "Resource not found"),
  USER_NOT_FOUND("3001", "User not found"),
  DOCUMENT_NOT_FOUND("3002", "Document not found"),
  ORGANIZATION_NOT_FOUND("3003", "Organization not found"),
  PROFILE_NOT_FOUND("3004", "Profile not found"),

  // Duplicate/Conflict errors (4xxx)
  DUPLICATE_RESOURCE("4000", "Resource already exists"),
  EMAIL_ALREADY_EXISTS("4001", "Email already exists"),
  ORGANIZATION_NAME_EXISTS("4002", "Organization name already exists"),
  DUPLICATE_ENROLLMENT("4003", "Already enrolled"),

  // Business logic errors (5xxx)
  INVALID_STATUS_TRANSITION("5000", "Invalid status transition"),
  OPERATION_NOT_ALLOWED("5001", "Operation not allowed"),
  INSUFFICIENT_PERMISSION("5002", "Insufficient permission"),
  QUOTA_EXCEEDED("5003", "Quota exceeded"),
  INVALID_FILE_TYPE("5004", "Invalid file type"),
  FILE_TOO_LARGE("5005", "File size exceeds limit"),

  // File & Storage errors (6xxx)
  FILE_STORAGE_ERROR("6000", "File storage error"),
  FILE_UPLOAD_FAILED("6001", "File upload failed"),
  FILE_DOWNLOAD_FAILED("6002", "File download failed"),
  FILE_DELETE_FAILED("6003", "File deletion failed"),
  FILE_NOT_FOUND("6004", "File not found"),

  // Email errors (7xxx)
  EMAIL_SEND_FAILED("7000", "Failed to send email"),
  EMAIL_TEMPLATE_ERROR("7001", "Email template error"),
  INVALID_EMAIL_FORMAT("7002", "Invalid email format"),

  // Database errors (8xxx)
  DATA_INTEGRITY_VIOLATION("8000", "Data integrity violation"),
  FOREIGN_KEY_VIOLATION("8001", "Related record not found"),
  UNIQUE_CONSTRAINT_VIOLATION("8002", "Duplicate entry"),

  // Import/Export errors (9xxx)
  IMPORT_FAILED("9000", "Import failed"),
  EXPORT_FAILED("9001", "Export failed"),
  INVALID_IMPORT_FORMAT("9002", "Invalid import file format"),
  IMPORT_VALIDATION_FAILED("9003", "Import validation failed");

  private final String code;
  private final String message;

  @Override
  public String toString() {
    return code + ": " + message;
  }
}
