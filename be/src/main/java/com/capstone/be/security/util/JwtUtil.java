package com.capstone.be.security.util;

import com.capstone.be.domain.enums.UserRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.JwtParser;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.io.DecodingException;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.Objects;
import java.util.UUID;
import javax.crypto.SecretKey;
import lombok.Getter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class JwtUtil {

  private static final String CLAIM_EMAIL = "email";
  private static final String CLAIM_ROLE = "role";
  private static final String CLAIM_ORG_ID = "orgId";

  private final String secret;
  @Getter
  private final long expirationMs;
  @Getter
  private final long emailVerificationExpirationMs;
  private final String issuer;

  private SecretKey secretKey;
  private JwtParser jwtParser;

  public JwtUtil(
      @Value("${app.security.jwt.secret}") String secret,
      @Value("${app.security.jwt.expirationMs}") long expirationMs,
      @Value("${app.security.jwt.emailVerificationExpirationMs}") long emailVerificationExpirationMs,
      @Value("${app.security.jwt.issuer}") String issuer) {
    this.secret = secret;
    this.expirationMs = expirationMs;
    this.emailVerificationExpirationMs = emailVerificationExpirationMs;
    this.issuer = issuer;
  }

  @PostConstruct
  void init() {
    if (!StringUtils.hasText(secret)) {
      throw new IllegalStateException("JWT secret must not be empty");
    }

    byte[] keyBytes;
    try {
      keyBytes = Decoders.BASE64.decode(secret);
    } catch (IllegalArgumentException | DecodingException ex) {
      keyBytes = secret.getBytes(StandardCharsets.UTF_8);
    }

    if (keyBytes.length < 32) {
      throw new IllegalStateException("JWT secret must be at least 32 bytes");
    }

    this.secretKey = Keys.hmacShaKeyFor(keyBytes);
    this.jwtParser = Jwts.parserBuilder()
        .requireIssuer(issuer)
        .setSigningKey(secretKey)
        .build();
  }

  public String generateToken(UUID subjectId, UserRole role, String email) {
    Objects.requireNonNull(subjectId, "subjectId must not be null");
    Objects.requireNonNull(role, "role must not be null");

    Date now = new Date();
    Date expiry = new Date(now.getTime() + expirationMs);

    return Jwts.builder()
        .setIssuer(issuer)
        .setSubject(String.valueOf(subjectId))
        .setIssuedAt(now)
        .setExpiration(expiry)
        .claim(CLAIM_EMAIL, email)
        .claim(CLAIM_ROLE, role.name())
        .signWith(secretKey, SignatureAlgorithm.HS256)
        .compact();
  }

  public Claims parseClaims(String token) throws JwtException {
    return jwtParser.parseClaimsJws(token).getBody();
  }

  public UserRole extractRole(Claims claims) {
    String rawRole = claims.get(CLAIM_ROLE, String.class);
    if (!StringUtils.hasText(rawRole)) {
      throw new JwtException("Missing role claim");
    }
    try {
      return UserRole.valueOf(rawRole);
    } catch (IllegalArgumentException ex) {
      throw new JwtException("Invalid role claim");
    }
  }

  public String extractEmail(Claims claims) {
    return claims.get(CLAIM_EMAIL, String.class);
  }

  public boolean isTokenValid(String token) {
    try {
      parseClaims(token);
      return true;
    } catch (JwtException | IllegalArgumentException ex) {
      return false;
    }
  }

  public String generateEmailVerifyToken(UserRole role, String email) {
    Objects.requireNonNull(email, "Email must not be Null");

    Date now = new Date();
    Date expiry = new Date(now.getTime() + emailVerificationExpirationMs);

    return Jwts.builder()
        .setIssuer(issuer)
        .setIssuedAt(now)
        .setExpiration(expiry)
        .claim(CLAIM_EMAIL, email)
        .claim(CLAIM_ROLE, role)
        .signWith(secretKey, SignatureAlgorithm.HS256)
        .compact();
  }

  public String generateUrlVerifyToken(String orgId, String readerEmail) {
    Objects.requireNonNull(readerEmail, "Email must not be Null");

    Date now = new Date();
    Date expiry = new Date(now.getTime() + emailVerificationExpirationMs);

    return Jwts.builder()
            .setIssuer(issuer)
            .setIssuedAt(now)
            .setExpiration(expiry)
            .claim(CLAIM_ORG_ID, orgId)
            .claim(CLAIM_EMAIL, readerEmail)
            .signWith(secretKey, SignatureAlgorithm.HS256)
            .compact();
  }
}
