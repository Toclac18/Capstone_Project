package com.capstone.be.dto.response.review;

import com.capstone.be.domain.enums.ReviewDecision;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO for document review
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentReviewResponse {

  private UUID id;
  private UUID reviewRequestId;
  private DocumentInfo document;
  private ReviewerInfo reviewer;
  private String report;
  private String reportFileUrl;
  private ReviewDecision decision;
  private Instant submittedAt;
  private Instant createdAt;
  private Instant updatedAt;

  /**
   * Nested DTO for document information in review
   */
  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class DocumentInfo {
    private UUID id;
    private String title;
    private String thumbnailUrl;
    private DocTypeInfo docType;
    private DomainInfo domain;
    private SpecializationInfo specialization;
    private java.util.List<TagInfo> tags;
  }

  /**
   * Nested DTO for document type
   */
  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class DocTypeInfo {
    private UUID id;
    private int code;
    private String name;
  }

  /**
   * Nested DTO for domain
   */
  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class DomainInfo {
    private UUID id;
    private int code;
    private String name;
  }

  /**
   * Nested DTO for specialization
   */
  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class SpecializationInfo {
    private UUID id;
    private int code;
    private String name;
  }

  /**
   * Nested DTO for tag
   */
  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class TagInfo {
    private UUID id;
    private Long code;
    private String name;
  }

  /**
   * Nested DTO for reviewer information
   */
  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class ReviewerInfo {
    private UUID id;
    private String username;
    private String email;
  }
}
