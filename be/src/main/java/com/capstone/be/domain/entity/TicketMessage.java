package com.capstone.be.domain.entity;

import com.capstone.be.domain.entity.common.BaseEntity;
import com.capstone.be.domain.enums.MsgAuthorType;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

// Lombok Annotations for clean code (matching your builder usage)
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode(callSuper = true)

// JPA Annotations
@Entity
@Table(name = "ticket_messages")
public class TicketMessage extends BaseEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long messageId;

  // Use a foreign key relationship if the Ticket entity exists
  // If you prefer to keep it as a simple Long for a more 'decoupled' data structure,
  // your original approach is fine, but this shows the JPA standard relationship:
  /*
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "ticket_id", nullable = false)
  private Ticket ticket;
  */

  // Sticking to your original Long ticketId field:
  @Column(name = "ticket_id", nullable = false)
  private Long ticketId;

  @Enumerated(EnumType.STRING)
  @Column(name = "author_type", nullable = false)
  private MsgAuthorType authorType;

  // Nullable as it might be an anonymous user (or a system message)
  @Column(name = "author_user_id")
  private Long authorUserId;

  @Lob // Used for large strings (TEXT/CLOB in SQL)
  @Column(nullable = false)
  private String body;
}
