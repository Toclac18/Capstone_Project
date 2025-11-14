package com.capstone.be.domain.entity;

import jakarta.persistence.Column;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import java.util.UUID;
import org.hibernate.annotations.UuidGenerator;

public class ReviewerDomainLink {

  @Id
  @UuidGenerator
  @Column(columnDefinition = "UUID")
  private UUID id;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "reviewer_id")
  private ReviewerProfile reviewer;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "domain_id")
  private Domain domain;
}
