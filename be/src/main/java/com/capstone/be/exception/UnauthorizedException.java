package com.capstone.be.exception;

import org.springframework.http.HttpStatus;

/**
 * Exception thrown when authentication fails or is required
 * Maps to HTTP 401 UNAUTHORIZED
 */
public class UnauthorizedException extends BusinessException {

  public UnauthorizedException(String message) {
    super(message, HttpStatus.UNAUTHORIZED, ErrorCode.UNAUTHORIZED.getCode());
  }

  public UnauthorizedException(String message, String errorCode) {
    super(message, HttpStatus.UNAUTHORIZED, errorCode);
  }

  // Specific unauthorized exceptions
  public static UnauthorizedException invalidCredentials() {
    return new UnauthorizedException(
        "Invalid email or password",
        ErrorCode.INVALID_CREDENTIALS.getCode()
    );
  }

  public static UnauthorizedException tokenExpired() {
    return new UnauthorizedException(
        "Your session has expired. Please login again",
        ErrorCode.TOKEN_EXPIRED.getCode()
    );
  }

  public static UnauthorizedException tokenInvalid() {
    return new UnauthorizedException(
        "Invalid authentication token",
        ErrorCode.TOKEN_INVALID.getCode()
    );
  }

  public static UnauthorizedException accountDisabled() {
    return new UnauthorizedException(
        "Your account has been disabled",
        ErrorCode.ACCOUNT_DISABLED.getCode()
    );
  }

  public static UnauthorizedException accountLocked() {
    return new UnauthorizedException(
        "Your account has been locked",
        ErrorCode.ACCOUNT_LOCKED.getCode()
    );
  }

  public static UnauthorizedException emailNotVerified() {
    return new UnauthorizedException(
        "Please verify your email address first",
        ErrorCode.EMAIL_NOT_VERIFIED.getCode()
    );
  }
}
