package com.capstone.be.domain.enums;

/**
 * Status of email change request
 */
public enum EmailChangeStatus {
  /**
   * OTP has been sent, waiting for verification
   */
  PENDING,

  /**
   * OTP verified, email changed successfully
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
