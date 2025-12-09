package com.capstone.be.dto.response.statistics;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lightweight response DTO for homepage trending documents
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HomepageTrendingDocumentsResponse {

  private List<TrendingDocument> documents;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class TrendingDocument {
    private UUID id;
    private String title;
    private String description;
    private String thumbnailUrl;
    private String docType;
    private String specialization;
    private Long viewCount;
    private Integer voteScore;
    private Double engagementScore;
    private Instant createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UploaderInfo {
      private UUID id;
      private String fullName;
      private String avatarUrl;
    }

    private UploaderInfo uploader;
  }
}
