package com.capstone.be.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when user is authenticated but not authorized to perform an action
 * Maps to HTTP 403 FORBIDDEN
 */
public class ForbiddenException extends BusinessException {

  public ForbiddenException(String message) {
    super(message, HttpStatus.FORBIDDEN, ErrorCode.FORBIDDEN.getCode());
  }

  public ForbiddenException(String message, String errorCode) {
    super(message, HttpStatus.FORBIDDEN, errorCode);
  }

  // Specific forbidden exceptions
  public static ForbiddenException insufficientPermission() {
    return new ForbiddenException(
        "You don't have permission to perform this action",
        ErrorCode.INSUFFICIENT_PERMISSION.getCode()
    );
  }

  public static ForbiddenException insufficientPermission(String action) {
    return new ForbiddenException(
        String.format("You don't have permission to %s", action),
        ErrorCode.INSUFFICIENT_PERMISSION.getCode()
    );
  }

  public static ForbiddenException operationNotAllowed() {
    return new ForbiddenException(
        "This operation is not allowed",
        ErrorCode.OPERATION_NOT_ALLOWED.getCode()
    );
  }

  public static ForbiddenException operationNotAllowed(String reason) {
    return new ForbiddenException(
        String.format("This operation is not allowed: %s", reason),
        ErrorCode.OPERATION_NOT_ALLOWED.getCode()
    );
  }
}
