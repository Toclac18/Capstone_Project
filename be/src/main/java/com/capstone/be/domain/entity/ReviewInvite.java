package com.capstone.be.domain.entity;

import com.capstone.be.domain.entity.common.BaseEntity;
import jakarta.persistence.*;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "review_invites")
@Data
@EqualsAndHashCode(callSuper = true)
public class ReviewInvite extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    @JoinColumn(name = "reviewer_id")
    private Reviewer reviewer;

    @ManyToOne
    @JoinColumn(name = "document_id")
    private Document document;

    private String status; // #temp

    private LocalDateTime expiry;
}
