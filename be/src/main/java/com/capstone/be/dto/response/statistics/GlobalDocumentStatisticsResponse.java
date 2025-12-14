package com.capstone.be.dto.response.statistics;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for global document statistics (View Global Document Statistics)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GlobalDocumentStatisticsResponse {

  // Summary statistics
  private SummaryStatistics summary;

  // Time series data
  private List<TimeSeriesData> documentUploads;
  private List<TimeSeriesData> documentViews;
  private List<TimeSeriesData> votesReceived;
  private List<TimeSeriesData> commentsReceived;
  private List<TimeSeriesData> documentsSaved;
  private List<TimeSeriesData> documentsPurchased;

  // Breakdowns
  private List<StatusBreakdown> statusBreakdown;
  private List<VisibilityBreakdown> visibilityBreakdown;
  private PremiumBreakdown premiumBreakdown;
  private List<OrganizationBreakdown> organizationBreakdown;
  private List<TypeBreakdown> typeBreakdown;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class SummaryStatistics {
    private Long totalDocuments;
    private Long totalViews;
    private Long totalUpvotes;
    private Long totalDownvotes;
    private Long totalComments;
    private Long totalSaves;
    private Long totalPurchases;
    private Long totalOrganizations;
    private Long totalUploaders;
    private Double averageViewsPerDocument;
    private Double averageVotesPerDocument;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class TimeSeriesData {
    private String date; // Format: YYYY-MM-DD
    private Long count;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class StatusBreakdown {
    private String status;
    private Long count;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class VisibilityBreakdown {
    private String visibility;
    private Long count;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class PremiumBreakdown {
    private Long premiumCount;
    private Long freeCount;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class OrganizationBreakdown {
    private String organizationId;
    private String organizationName;
    private Long documentCount;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class TypeBreakdown {
    private String typeId;
    private String typeName;
    private Long count;
  }
}

