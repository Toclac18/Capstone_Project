package com.capstone.be.util;

import java.security.SecureRandom;
import java.util.Base64;

/**
 * Utility class for generating secure tokens
 */
public class TokenUtil {

  private static final SecureRandom SECURE_RANDOM = new SecureRandom();
  private static final int TOKEN_BYTES = 48; // 48 bytes = 64 characters in Base64

  private TokenUtil() {
    // Private constructor to prevent instantiation
  }

  /**
   * Generate a secure random token (48 bytes -> 64 chars in Base64)
   *
   * @return Random token string
   */
  public static String generateResetToken() {
    byte[] randomBytes = new byte[TOKEN_BYTES];
    SECURE_RANDOM.nextBytes(randomBytes);
    return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
  }
}
