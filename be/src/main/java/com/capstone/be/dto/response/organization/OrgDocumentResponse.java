package com.capstone.be.dto.response.organization;

import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.DocVisibility;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for organization document
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrgDocumentResponse {

  private UUID id;
  private String title;
  private String description;
  private String thumbnailUrl;
  private DocStatus status;
  private DocVisibility visibility;
  private Boolean isPremium;
  private Integer price;
  private Integer pageCount;
  private Integer viewCount;
  private Integer upvoteCount;
  private Instant createdAt;
  private Instant updatedAt;

  // Uploader info
  private UploaderInfo uploader;

  // DocType info
  private DocTypeInfo docType;

  // Specialization info
  private SpecializationInfo specialization;

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
  public static class DocTypeInfo {
    private UUID id;
    private String name;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class SpecializationInfo {
    private UUID id;
    private String name;
    private String domainName;
  }
}
