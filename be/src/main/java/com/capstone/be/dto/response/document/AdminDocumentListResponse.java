package com.capstone.be.dto.response.document;

import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.DocVisibility;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDocumentListResponse {

  private UUID id;
  private String title;
  private DocStatus status;
  private DocVisibility visibility;
  private Boolean isPremium;
  private Integer price;
  private String thumbnailUrl;
  private Integer viewCount;
  private Integer upvoteCount;
  private Integer voteScore;
  private Instant createdAt;
  private Instant updatedAt;

  private UploaderInfo uploader;
  private OrganizationInfo organization;
  private String docTypeName;
  private String specializationName;
  
  // Additional linked information
  private Long commentCount;
  private Long saveCount;
  private Long reportCount;
  private Long purchaseCount;  // Only for premium documents
  private ReviewStatusInfo reviewStatus;  // Review status for premium documents

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class UploaderInfo {

    private UUID id;
    private String fullName;
    private String email;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class OrganizationInfo {

    private UUID id;
    private String name;
  }
  
  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class ReviewStatusInfo {
    private Integer pendingCount;  // Number of PENDING review requests
    private Integer acceptedCount;  // Number of ACCEPTED review requests
    private Integer completedCount;  // Number of COMPLETED reviews
    private Integer rejectedCount;  // Number of REJECTED review requests
    private Integer expiredCount;  // Number of EXPIRED review requests
    private Boolean hasActiveReview;  // True if has any PENDING or ACCEPTED requests
  }
}
