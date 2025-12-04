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
}
