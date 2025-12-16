package com.capstone.be.dto.response.review;

import com.capstone.be.domain.enums.ReviewRequestStatus;
import com.capstone.be.domain.enums.DocStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewRequestResponse {

  private UUID id;
  private DocumentInfo document;
  private ReviewerInfo reviewer;
  private AssignedByInfo assignedBy;
  private ReviewRequestStatus status;
  private Instant responseDeadline;
  private Instant reviewDeadline;
  private Instant respondedAt;
  private String rejectionReason;
  private String note;
  private Instant createdAt;
  private Instant updatedAt;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class DocumentInfo {
    private UUID id;
    private String title;
    private String description;
    private String thumbnailUrl;
    private String fileUrl;
    private Integer pageCount;
    private Integer price;
    private DocStatus status;
    private DocTypeInfo docType;
    private DomainInfo domain;
    private SpecializationInfo specialization;
    private java.util.List<TagInfo> tags;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class DocTypeInfo {
    private UUID id;
    private Integer code;
    private String name;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class DomainInfo {
    private UUID id;
    private Integer code;
    private String name;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class SpecializationInfo {
    private UUID id;
    private Integer code;
    private String name;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class TagInfo {
    private UUID id;
    private Long code;
    private String name;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class ReviewerInfo {
    private UUID userId;
    private String email;
    private String fullName;
    private String avatarUrl;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class AssignedByInfo {
    private UUID userId;
    private String email;
    private String fullName;
  }
}
