package com.capstone.be.security.jwt;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.MalformedJwtException;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.UnsupportedJwtException;
import io.jsonwebtoken.security.Keys;
import io.jsonwebtoken.security.SignatureException;
import java.util.Date;
import java.util.UUID;
import javax.crypto.SecretKey;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Slf4j
@Component
public class JwtUtil {

  private final SecretKey secretKey;
  private final long jwtExpirationMs;
  private final long emailVerificationExpirationMs;
  private final String issuer;

  public JwtUtil(
      @Value("${app.security.jwt.secret}") String secret,
      @Value("${app.security.jwt.expirationMs}") long jwtExpirationMs,
      @Value("${app.security.jwt.emailVerificationExpirationMs}") long emailVerificationExpirationMs,
      @Value("${app.security.jwt.issuer}") String issuer) {
    this.secretKey = Keys.hmacShaKeyFor(secret.getBytes());
    this.jwtExpirationMs = jwtExpirationMs;
    this.emailVerificationExpirationMs = emailVerificationExpirationMs;
    this.issuer = issuer;
  }

  /**
   * Generate JWT token for authentication
   */
  public String generateToken(UUID userId, String email, String role) {
    Date now = new Date();
    Date expiryDate = new Date(now.getTime() + jwtExpirationMs);

    return Jwts.builder()
        .setSubject(userId.toString())
        .claim("email", email)
        .claim("role", role)
        .setIssuer(issuer)
        .setIssuedAt(now)
        .setExpiration(expiryDate)
        .signWith(secretKey, SignatureAlgorithm.HS512)
        .compact();
  }

  /**
   * Generate JWT token for email verification
   */
  public String generateEmailVerificationToken(UUID userId, String email) {
    Date now = new Date();
    Date expiryDate = new Date(now.getTime() + emailVerificationExpirationMs);

    return Jwts.builder()
        .setSubject(userId.toString())
        .claim("email", email)
        .claim("type", "email_verification")
        .setIssuer(issuer)
        .setIssuedAt(now)
        .setExpiration(expiryDate)
        .signWith(secretKey, SignatureAlgorithm.HS512)
        .compact();
  }

  /**
   * Extract user ID from JWT token
   */
  public UUID getUserIdFromToken(String token) {
    Claims claims = getClaimsFromToken(token);
    return UUID.fromString(claims.getSubject());
  }

  /**
   * Extract email from JWT token
   */
  public String getEmailFromToken(String token) {
    Claims claims = getClaimsFromToken(token);
    return claims.get("email", String.class);
  }

  /**
   * Extract role from JWT token
   */
  public String getRoleFromToken(String token) {
    Claims claims = getClaimsFromToken(token);
    return claims.get("role", String.class);
  }

  /**
   * Validate JWT token
   */
  public boolean validateToken(String token) {
    try {
      Jwts.parserBuilder()
          .setSigningKey(secretKey)
          .build()
          .parseClaimsJws(token);
      return true;
    } catch (SignatureException ex) {
      log.error("Invalid JWT signature: {}", ex.getMessage());
    } catch (MalformedJwtException ex) {
      log.error("Invalid JWT token: {}", ex.getMessage());
    } catch (ExpiredJwtException ex) {
      log.error("Expired JWT token: {}", ex.getMessage());
    } catch (UnsupportedJwtException ex) {
      log.error("Unsupported JWT token: {}", ex.getMessage());
    } catch (IllegalArgumentException ex) {
      log.error("JWT claims string is empty: {}", ex.getMessage());
    }
    return false;
  }

  /**
   * Get all claims from token
   */
  private Claims getClaimsFromToken(String token) {
    return Jwts.parserBuilder()
        .setSigningKey(secretKey)
        .build()
        .parseClaimsJws(token)
        .getBody();
  }
}
