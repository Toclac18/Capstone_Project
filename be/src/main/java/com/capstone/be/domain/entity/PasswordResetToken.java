package com.capstone.be.domain.entity;

import com.capstone.be.domain.entity.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * Entity to store one-time reset tokens after OTP verification
 * Token is valid for 10 minutes and can only be used once
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken extends BaseEntity {

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  /**
   * Random 32-64 bytes reset token (hashed)
   */
  @Column(nullable = false, unique = true, length = 128)
  private String tokenHash;

  /**
   * Token expiry time (10 minutes from creation)
   */
  @Column(nullable = false)
  private Instant expiryTime;

  /**
   * Whether this token has been used
   */
  @Column(nullable = false)
  @lombok.Builder.Default
  private Boolean used = false;

  public boolean isExpired() {
    return Instant.now().isAfter(expiryTime);
  }

  public boolean isValid() {
    return !used && !isExpired();
  }
}
