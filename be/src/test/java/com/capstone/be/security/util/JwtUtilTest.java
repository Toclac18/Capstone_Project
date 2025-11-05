package com.capstone.be.security.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.capstone.be.domain.enums.UserRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.UUID;
import org.junit.jupiter.api.Test;

class JwtUtilTest {

  private static final String RAW_SECRET = "01234567890123456789012345678901";
  private static final String BASE64_SECRET =
      Base64.getEncoder().encodeToString(RAW_SECRET.getBytes(StandardCharsets.UTF_8));

  @Test
  void generateToken_roundTrip() {
    JwtUtil jwtUtil = createAndInit(BASE64_SECRET, 3600L, 7200L, "issuer");

    UUID subjectId = UUID.randomUUID();
    String token = jwtUtil.generateToken(subjectId, UserRole.READER, "reader@example.com");
    Claims claims = jwtUtil.parseClaims(token);

    assertEquals("issuer", claims.getIssuer());
    assertEquals(subjectId.toString(), claims.getSubject());
    assertEquals("reader@example.com", jwtUtil.extractEmail(claims));
    assertEquals(UserRole.READER, jwtUtil.extractRole(claims));
    assertTrue(jwtUtil.isTokenValid(token));
  }

  @Test
  void initRejectsShortSecret() {
    JwtUtil jwtUtil = new JwtUtil("short-secret", 3600L, 7200L, "issuer");

    IllegalStateException ex = assertThrows(IllegalStateException.class, jwtUtil::init);
    assertTrue(ex.getMessage().contains("at least 32 bytes"));
  }

  @Test
  void initRejectsBlankSecret() {
    JwtUtil jwtUtil = new JwtUtil("   ", 3600L, 7200L, "issuer");

    IllegalStateException ex = assertThrows(IllegalStateException.class, jwtUtil::init);
    assertTrue(ex.getMessage().contains("must not be empty"));
  }

  @Test
  void extractRoleMissingThrows() {
    JwtUtil jwtUtil = createAndInit(BASE64_SECRET, 3600L, 7200L, "issuer");
    Claims claims = Jwts.claims();

    assertThrows(JwtException.class, () -> jwtUtil.extractRole(claims));
  }

  @Test
  void extractRoleInvalidThrows() {
    JwtUtil jwtUtil = createAndInit(BASE64_SECRET, 3600L, 7200L, "issuer");
    Claims claims = Jwts.claims();
    claims.put("role", "UNKNOWN");

    assertThrows(JwtException.class, () -> jwtUtil.extractRole(claims));
  }

  @Test
  void isTokenValidReturnsFalseWhenParsingFails() {
    JwtUtil jwtUtil = createAndInit(BASE64_SECRET, 3600L, 7200L, "issuer");

    assertFalse(jwtUtil.isTokenValid("not-a-jwt"));
  }

  private JwtUtil createAndInit(
      String secret, long expirationMs, long emailVerifyExpirationMs, String issuer) {
    JwtUtil jwtUtil = new JwtUtil(secret, expirationMs, emailVerifyExpirationMs, issuer);
    jwtUtil.init();
    return jwtUtil;
  }
}
