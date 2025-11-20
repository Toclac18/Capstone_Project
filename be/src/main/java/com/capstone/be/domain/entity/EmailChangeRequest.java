package com.capstone.be.domain.entity;

import com.capstone.be.domain.entity.common.BaseEntity;
import com.capstone.be.domain.enums.EmailChangeStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * Entity to track email change requests with OTP verification
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(name = "email_change_requests")
public class EmailChangeRequest extends BaseEntity {

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id", nullable = false)
  private User user;

  @Column(nullable = false)
  private String currentEmail;

  @Column(nullable = false)
  private String newEmail;

  /**
   * Hashed OTP code for security
   */
  @Column(nullable = false)
  private String otpHash;

  @Column(nullable = false)
  private LocalDateTime expiryTime;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private EmailChangeStatus status;

  /**
   * Number of verification attempts (max 5)
   */
  @Column(nullable = false)
  @lombok.Builder.Default
  private Integer attemptCount = 0;

  /**
   * Maximum allowed verification attempts
   */
  private static final int MAX_ATTEMPTS = 5;

  public boolean isExpired() {
    return LocalDateTime.now().isAfter(expiryTime);
  }

  public boolean isMaxAttemptsReached() {
    return attemptCount >= MAX_ATTEMPTS;
  }

  public void incrementAttemptCount() {
    this.attemptCount++;
  }
}
