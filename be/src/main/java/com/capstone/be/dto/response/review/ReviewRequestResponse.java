package com.capstone.be.dto.response.review;

import com.capstone.be.domain.enums.ReviewRequestStatus;
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
    private Integer pageCount;
    private Integer price;
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
