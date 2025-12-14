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
 * Response DTO for document library view
 * Includes documents uploaded by user or purchased/redeemed by user
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentLibraryResponse {

  private UUID id;
  private String title;
  private String description;
  private DocVisibility visibility;
  private DocStatus status;
  private Boolean isPremium;
  private Integer price;
  private String thumbnailUrl;
  private Integer viewCount;
  private Integer upvoteCount;
  private Integer voteScore;
  private Integer pageCount;
  private Instant createdAt;
  private Instant updatedAt;

  // Metadata
  private String docTypeName;
  private String specializationName;
  private String domainName;
  private String organizationName;
  private List<String> tagNames;

  // Uploader info
  private UploaderInfo uploader;

  // User relationship info
  private UserRelationInfo userRelation;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class UploaderInfo {

    private UUID id;
    private String fullName;
    private String avatarUrl;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class UserRelationInfo {

    private Boolean isOwned; // User uploaded this document
    private Boolean isPurchased; // User redeemed/purchased this document
    private Instant purchasedAt; // When user purchased (if applicable)
  }
}
