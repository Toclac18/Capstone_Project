package com.capstone.be.util;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
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

  /**
   * SHA-256 của token, viết dạng hex thường (64 ký tự).
   *
   * <p>Dùng để lưu và TRA token trong DB. Không dùng bcrypt cho việc này: bcrypt có salt
   * ngẫu nhiên nên hai lần băm cùng một token cho hai chuỗi khác nhau ⇒ không tra được
   * bằng truy vấn, chỉ còn cách quét từng dòng và so lần lượt.
   *
   * <p>bcrypt tồn tại để làm chậm việc dò mật khẩu do người đặt, vốn có entropy thấp.
   * Token ở đây là {@value #TOKEN_BYTES} byte từ {@link SecureRandom} — 384 bit — nên
   * không có gì để dò: bảng tra trước cho không gian 2^384 là bất khả thi. Đây cũng là
   * cách thư viện phổ biến lưu token dùng-một-lần.
   *
   * @param token token thô
   * @return SHA-256 dạng hex thường
   */
  public static String sha256Hex(String token) {
    try {
      byte[] digest =
          MessageDigest.getInstance("SHA-256").digest(token.getBytes(StandardCharsets.UTF_8));
      StringBuilder hex = new StringBuilder(digest.length * 2);
      for (byte b : digest) {
        hex.append(Character.forDigit((b >> 4) & 0xF, 16));
        hex.append(Character.forDigit(b & 0xF, 16));
      }
      return hex.toString();
    } catch (NoSuchAlgorithmException e) {
      // SHA-256 là thuật toán mọi JVM bắt buộc có.
      throw new IllegalStateException("SHA-256 not available", e);
    }
  }
}
