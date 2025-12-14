    package com.capstone.be.domain.entity;

import com.capstone.be.domain.entity.common.BaseEntity;
import com.capstone.be.domain.enums.ContactCategory;
import com.capstone.be.domain.enums.ContactStatus;
import com.capstone.be.domain.enums.ContactUrgency;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.util.Random;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * Contact ticket entity for users to contact admin/support
 * Supports both authenticated users and guest submissions
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(name = "contact_tickets")
public class ContactTicket extends BaseEntity {

  @Column(nullable = false, unique = true, length = 20)
  private String ticketCode;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "user_id")
  private User user;

  @Column(nullable = false, length = 100)
  private String name;

  @Column(nullable = false, length = 255)
  private String email;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private ContactCategory category;

  @Column(length = 100)
  private String otherCategory;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private ContactUrgency urgency;

  @Column(nullable = false, length = 500)
  private String subject;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String message;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private ContactStatus status;

  @Column(length = 100)
  private String ipAddress;

  @Column(columnDefinition = "TEXT")
  private String adminNotes;

  /**
   * Generate unique ticket code before persisting
   * Format: TCK-YYYYMMDD-XXXXX (e.g., TCK-20241117-AB3F2)
   */
  @PrePersist
  public void generateTicketCode() {
    super.generateId();
    if (this.ticketCode == null) {
      String datePart = String.valueOf(System.currentTimeMillis() / 1000);
      String randomPart = generateRandomString(5);
      this.ticketCode = "TCK-" + datePart + "-" + randomPart;
    }
    if (this.status == null) {
      this.status = ContactStatus.NEW;
    }
  }

  private String generateRandomString(int length) {
    String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    Random random = new Random();
    StringBuilder sb = new StringBuilder(length);
    for (int i = 0; i < length; i++) {
      sb.append(chars.charAt(random.nextInt(chars.length())));
    }
    return sb.toString();
  }
}
