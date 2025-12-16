package com.capstone.be.dto.response.review;

import com.capstone.be.domain.enums.ReviewDecision;
import com.capstone.be.domain.enums.ReviewResultStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO for review result
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResultResponse {

  private UUID id;
  private UUID reviewRequestId;
  private DocumentInfo document;
  private ReviewerInfo reviewer;
  private UploaderInfo uploader;
  private String report;
  private String reportFileUrl;
  private ReviewDecision decision;
  private ReviewResultStatus status;
  private Instant submittedAt;
  private ApprovalInfo approval;
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
    private String fileUrl;
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
    private String fullName;
    private String email;
    private String avatarUrl;
  }

  /**
   * Nested DTO for uploader information
   */
  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class UploaderInfo {
    private UUID id;
    private String fullName;
    private String email;
  }

  /**
   * Nested DTO for BA approval information
   */
  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class ApprovalInfo {
    private UUID approvedById;
    private String approvedByName;
    private Instant approvedAt;
    private String rejectionReason;
  }
}
