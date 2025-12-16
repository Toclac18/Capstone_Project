package com.capstone.be.dto.response.document;

import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.DocVisibility;
import com.capstone.be.domain.enums.ReportReason;
import com.capstone.be.domain.enums.ReportStatus;
import com.capstone.be.domain.enums.ReviewRequestStatus;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for document detail view with comprehensive metadata
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentDetailResponse {

  private UUID id;
  private String title;
  private String description;
  private DocVisibility visibility;
  private DocStatus status;
  private Boolean isPremium;
  private Integer price;
  private String thumbnailUrl;
  private String presignedUrl;  // Presigned URL for document access (if user has access)
  private Integer pageCount;
  private Integer viewCount;
  private Integer upvoteCount;
  private Integer downvoteCount;
  private Integer voteScore;
  private Instant createdAt;
  private Instant updatedAt;

  // --- Summarizations ---
  // Field này sẽ chứa object { shortSummary, mediumSummary, detailedSummary }
  private SummarizationInfo summarizations;

  // Uploader information
  private UploaderInfo uploader;

  // Organization information (nullable)
  private OrganizationInfo organization;

  // Document type information
  private DocTypeInfo docType;

  // Specialization information
  private SpecializationInfo specialization;

  // Tags
  private List<TagInfo> tags;

  // User-specific information
  private UserDocumentInfo userInfo;
  
  // Admin-specific information (only populated for admin requests)
  private AdminInfo adminInfo;

  // --- Inner Classes ---

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class SummarizationInfo {
    private String shortSummary;
    private String mediumSummary;
    private String detailedSummary;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class UploaderInfo {

    private UUID id;
    private String fullName;
    private String email;
    private String avatarUrl;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class OrganizationInfo {

    private UUID id;
    private String name;
    private String logoUrl;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class DocTypeInfo {

    private UUID id;
    private String name;
    private String description;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class SpecializationInfo {

    private UUID id;
    private String name;
    private DomainInfo domain;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class DomainInfo {

    private UUID id;
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
  public static class UserDocumentInfo {

    private Boolean hasAccess;
    private Boolean isUploader;
    private Boolean hasRedeemed;
    private Boolean isMemberOfOrganization;
    private Boolean isReviewer;  // True if user is assigned as reviewer for this document
  }
  
  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class AdminInfo {
    private Long commentCount;
    private Long saveCount;
    private Long reportCount;
    private Long purchaseCount;  // Only for premium documents
    private ReviewRequestSummary reviewRequestSummary;  // Only for premium documents
    private List<ReviewRequestInfo> reviewRequests;  // Only for premium documents
    private List<ReportInfo> reports;  // Recent reports
  }
  
  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class ReviewRequestSummary {
    private Integer pendingCount;
    private Integer acceptedCount;
    private Integer submittedReviewCount;  // Number of ReviewResults submitted
    private Integer rejectedCount;
    private Integer expiredCount;
    private Boolean hasActiveReview;
  }
  
  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class ReviewRequestInfo {
    private UUID id;
    private ReviewerInfo reviewer;
    private AssignedByInfo assignedBy;
    private ReviewRequestStatus status;
    private Instant responseDeadline;
    private Instant reviewDeadline;
    private Instant respondedAt;
    private String rejectionReason;
    private String note;
    private Instant createdAt;
  }
  
  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class ReviewerInfo {
    private UUID id;
    private String email;
    private String fullName;
  }
  
  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class AssignedByInfo {
    private UUID id;
    private String email;
    private String fullName;
  }
  
  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class ReportInfo {
    private UUID id;
    private ReporterInfo reporter;
    private ReportReason reason;
    private String description;
    private ReportStatus status;
    private String adminNotes;
    private Instant createdAt;
  }
  
  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class ReporterInfo {
    private UUID id;
    private String email;
    private String fullName;
  }
}