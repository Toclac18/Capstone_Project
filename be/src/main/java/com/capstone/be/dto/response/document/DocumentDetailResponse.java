package com.capstone.be.dto.response.document;

import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.DocVisibility;
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
  private Integer pageCount;
  private Integer viewCount;
  private Integer upvoteCount;
  private Integer downvoteCount;
  private Integer voteScore;
  private Instant createdAt;
  private Instant updatedAt;

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
  }
}
