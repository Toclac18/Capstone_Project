package com.capstone.be.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when attempting to create a resource that already exists
 * Maps to HTTP 409 CONFLICT
 */
public class DuplicateResourceException extends BusinessException {

  public DuplicateResourceException(String message) {
    super(message, HttpStatus.CONFLICT, ErrorCode.DUPLICATE_RESOURCE.getCode());
  }

  public DuplicateResourceException(String resourceName, String fieldName, Object fieldValue) {
    super(
        String.format("%s already exists with %s: %s", resourceName, fieldName, fieldValue),
        HttpStatus.CONFLICT,
        ErrorCode.DUPLICATE_RESOURCE.getCode()
    );
  }

  // Specific duplicate resource exceptions
  public static DuplicateResourceException email(String email) {
    return new DuplicateResourceException(
        String.format("Email already exists: %s", email),
        HttpStatus.CONFLICT,
        ErrorCode.EMAIL_ALREADY_EXISTS.getCode()
    );
  }

  public static DuplicateResourceException organizationName(String name) {
    return new DuplicateResourceException(
        String.format("Organization name already exists: %s", name),
        HttpStatus.CONFLICT,
        ErrorCode.ORGANIZATION_NAME_EXISTS.getCode()
    );
  }

  public static DuplicateResourceException enrollment(String userEmail, String organizationName) {
    return new DuplicateResourceException(
        String.format("User %s is already enrolled in organization %s", userEmail, organizationName),
        HttpStatus.CONFLICT,
        ErrorCode.DUPLICATE_ENROLLMENT.getCode()
    );
  }

  private DuplicateResourceException(String message, HttpStatus status, String errorCode) {
    super(message, status, errorCode);
  }
}
