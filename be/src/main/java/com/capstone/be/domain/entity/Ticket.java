package com.capstone.be.domain.entity;

import com.capstone.be.domain.entity.common.BaseEntity;
import com.capstone.be.domain.enums.TicketCategory;
import com.capstone.be.domain.enums.TicketStatus;
import com.capstone.be.domain.enums.TicketUrgency;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.Instant;

@EqualsAndHashCode(callSuper = true)
@Data
@Entity
@Table(name = "tickets")
public class Ticket extends BaseEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long ticketId;

    @Column(name = "ticket_code", length = 20, nullable = false, unique = true)
    private String ticketCode;

    @Column(name = "requester_user_id")
    private Long requesterUserId;

    @Column(name = "requester_name", length = 120, nullable = false)
    private String requesterName;

    @Column(name = "requester_email", nullable = false)
    private String requesterEmail;

    @Column(length = 160, nullable = false)
    private String subject;

    @Lob
    @Column(nullable = false)
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketCategory category = TicketCategory.OTHER;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketUrgency urgency = TicketUrgency.NORMAL;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketStatus status = TicketStatus.OPEN;

    @Column(name = "assigned_to")
    private Long assignedTo;

    @Column(name = "closed_at")
    private Instant closedAt;
}
