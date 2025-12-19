package com.capstone.be.domain.enums;

/**
 * Status of password reset request
 */
public enum PasswordResetStatus {
  /**
   * OTP has been sent, waiting for verification
   */
  PENDING,

  /**
   * OTP verified, password reset successfully
   */
  VERIFIED,

  /**
   * Request expired (OTP expired or exceeded max attempts)
   */
  EXPIRED,

  /**
   * Request cancelled by user
   */
  CANCELLED
}
