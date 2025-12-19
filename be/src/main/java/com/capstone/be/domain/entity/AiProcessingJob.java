package com.capstone.be.domain.entity;

import com.capstone.be.domain.entity.common.BaseEntity;
import com.capstone.be.domain.enums.AiJobStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * Entity to track AI processing jobs for documents.
 * Stores job_id from AI service and tracks processing status.
 */
@Entity
@Table(name = "ai_processing_jobs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class AiProcessingJob extends BaseEntity {

  /**
   * The document being processed
   */
  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "document_id", nullable = false)
  private Document document;

  /**
   * Job ID from AI service (UUID string)
   */
  @Column(nullable = false, unique = true, length = 100)
  private String jobId;

  /**
   * Status of the job
   */
  @Enumerated(EnumType.STRING)
  @Column(nullable = false, length = 20)
  @Builder.Default
  private AiJobStatus status = AiJobStatus.PENDING;

  /**
   * Filename of the document being processed
   */
  @Column(length = 500)
  private String filename;

  /**
   * Error message if job failed
   */
  @Column(columnDefinition = "TEXT")
  private String errorMessage;

  /**
   * Callback URL that was provided to AI service
   */
  @Column(length = 500)
  private String callbackUrl;

  /**
   * Processing start time (timestamp from AI service)
   */
  @Column
  private Long startedAt;

  /**
   * Processing completion time (timestamp from AI service)
   */
  @Column
  private Long completedAt;

  /**
   * Processing time in seconds (calculated)
   */
  @Column
  private Double processingTimeSeconds;
}

