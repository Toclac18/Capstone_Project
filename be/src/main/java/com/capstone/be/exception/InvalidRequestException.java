package com.capstone.be.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when request parameters or body are invalid
 * Maps to HTTP 400 BAD REQUEST
 */
public class InvalidRequestException extends BusinessException {

  public InvalidRequestException(String message) {
    super(message, HttpStatus.BAD_REQUEST, ErrorCode.INVALID_REQUEST.getCode());
  }

  public InvalidRequestException(String message, String errorCode) {
    super(message, HttpStatus.BAD_REQUEST, errorCode);
  }

  // Specific invalid request exceptions
  public static InvalidRequestException invalidStatusTransition(String from, String to) {
    return new InvalidRequestException(
        String.format("Cannot transition from status %s to %s", from, to),
        ErrorCode.INVALID_STATUS_TRANSITION.getCode()
    );
  }

  public static InvalidRequestException invalidFileType(String actualType, String... allowedTypes) {
    return new InvalidRequestException(
        String.format("Invalid file type: %s. Allowed types: %s", actualType, String.join(", ", allowedTypes)),
        ErrorCode.INVALID_FILE_TYPE.getCode()
    );
  }

  public static InvalidRequestException fileTooLarge(long actualSize, long maxSize) {
    return new InvalidRequestException(
        String.format("File size (%d bytes) exceeds maximum allowed size (%d bytes)", actualSize, maxSize),
        ErrorCode.FILE_TOO_LARGE.getCode()
    );
  }

  public static InvalidRequestException quotaExceeded(String resourceType, int limit) {
    return new InvalidRequestException(
        String.format("Quota exceeded for %s. Maximum allowed: %d", resourceType, limit),
        ErrorCode.QUOTA_EXCEEDED.getCode()
    );
  }

  public static InvalidRequestException invalidEmailFormat(String email) {
    return new InvalidRequestException(
        String.format("Invalid email format: %s", email),
        ErrorCode.INVALID_EMAIL_FORMAT.getCode()
    );
  }
}
