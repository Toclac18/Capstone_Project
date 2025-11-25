package com.capstone.be.dto.response.document;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for document search results
 * Contains essential document information for search listings
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentSearchResponse {

  private UUID id;
  private String title;
  private String description;
  private Boolean isPremium;
  private Integer price;
  private String thumbnailUrl;
  private Instant createdAt;

  // Statistics
  private Integer viewCount;
  private Integer upvoteCount;
  private Integer voteScore;

  // Document categorization
  private String docTypeName;
  private String specializationName;
  private String domainName;
  private List<String> tagNames;

  // Organization info (if belongs to an organization)
  private OrganizationInfo organization;

  // Uploader info
  private UploaderInfo uploader;

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
  public static class UploaderInfo {

    private UUID id;
    private String fullName;
    private String avatarUrl;
  }
}
