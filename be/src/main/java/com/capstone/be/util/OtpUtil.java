package com.capstone.be.util;

import java.security.SecureRandom;

/**
 * Utility class for generating OTP codes
 */
public class OtpUtil {

  private static final SecureRandom RANDOM = new SecureRandom();
  private static final int OTP_LENGTH = 6;

  private OtpUtil() {
    // Private constructor to prevent instantiation
  }

  /**
   * Generate a 6-digit OTP code
   *
   * @return 6-digit OTP as String
   */
  public static String generateOtp() {
    int otp = RANDOM.nextInt(900000) + 100000; // Generate number between 100000 and 999999
    return String.valueOf(otp);
  }
}
