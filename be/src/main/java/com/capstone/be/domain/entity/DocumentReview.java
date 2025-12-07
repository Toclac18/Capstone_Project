package com.capstone.be.domain.entity;

import com.capstone.be.domain.entity.common.BaseEntity;
import com.capstone.be.domain.enums.ReviewDecision;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

/**
 * Entity representing a review submission by a reviewer for a document
 * This is created when a reviewer submits their review (report + decision)
 */
@Entity
@Table(name = "document_review")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class DocumentReview extends BaseEntity {

  /**
   * The review request this review is for
   */
  @OneToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "review_request_id", nullable = false, unique = true)
  private ReviewRequest reviewRequest;

  /**
   * The document being reviewed
   */
  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "document_id", nullable = false)
  private Document document;

  /**
   * The reviewer who submitted this review
   */
  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "reviewer_id", nullable = false)
  private User reviewer;

  /**
   * Review comment written by the reviewer
   */
  @Column(columnDefinition = "TEXT", nullable = false)
  private String comment;

  /**
   * File path/key of the review report document (docx) stored in S3
   */
  @Column(nullable = false, length = 500)
  private String reportFilePath;

  /**
   * Decision made by the reviewer (APPROVED or REJECTED)
   */
  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  private ReviewDecision decision;

  /**
   * Timestamp when the review was submitted
   */
  @Column(nullable = false)
  private java.time.Instant submittedAt;
}
