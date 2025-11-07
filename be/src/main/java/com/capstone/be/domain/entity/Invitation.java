package com.capstone.be.domain.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "invitations")
@Getter
@Setter
public class Invitation {

    @Id
    @Column(name = "id", nullable = false, length = 64)
    private UUID id = UUID.randomUUID();

    @Column(name = "organization_id", length = 64, nullable = false)
    private String orgId;

    @Column(name = "email", length = 255, nullable = false)
    private String email;

    @Column(name = "username", length = 100)
    private String username;

    @Column(name = "token", length = 2048, nullable = false, unique = true)
    private String token;

    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "created_by", length = 100)
    private String createdBy;

    @Column(name = "accepted")
    private boolean accepted;
}