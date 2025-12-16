package com.capstone.be.domain.entity;

import com.capstone.be.domain.entity.common.BaseEntity;
import com.capstone.be.domain.enums.ReviewDecision;
import com.capstone.be.domain.enums.ReviewResultStatus;
import jakarta.persistence.*;
import lombok.*;
import lombok.experimental.SuperBuilder;

import java.time.Instant;

/**
 * Entity representing a review result submitted by a reviewer for a document
 * This is created when a reviewer submits their review (report + decision)
 * One ReviewRequest can have multiple ReviewResults (if BA rejects and reviewer re-submits)
 */
@Entity
@Table(name = "review_result")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class ReviewResult extends BaseEntity {

  /**
   * The review request this result is for
   */
  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "review_request_id", nullable = false)
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
   * Status of this review result (PENDING, APPROVED, REJECTED by BA)
   */
  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  @Builder.Default
  private ReviewResultStatus status = ReviewResultStatus.PENDING;

  /**
   * Timestamp when the review was submitted
   */
  @Column(nullable = false)
  private Instant submittedAt;

  /**
   * BA who approved/rejected this review result
   */
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "approved_by_id")
  private User approvedBy;

  /**
   * Timestamp when BA approved/rejected
   */
  private Instant approvedAt;

  /**
   * Reason if BA rejects the review result (requires reviewer to re-review)
   */
  @Column(columnDefinition = "TEXT")
  private String rejectionReason;
}
