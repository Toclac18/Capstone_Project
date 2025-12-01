package com.capstone.be.dto.response.statistics;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for personal document statistics (STA1)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PersonalDocumentStatisticsResponse {

  // Summary statistics
  private SummaryStatistics summary;

  // Time series data
  private List<TimeSeriesData> documentUploads;
  private List<TimeSeriesData> documentViews;
  private List<TimeSeriesData> votesReceived;
  private List<TimeSeriesData> commentsReceived;
  private List<TimeSeriesData> documentsSaved;

  // Breakdowns
  private List<StatusBreakdown> statusBreakdown;
  private PremiumBreakdown premiumBreakdown;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class SummaryStatistics {
    private Long totalDocumentsUploaded;
    private Long totalViews;
    private Long totalUpvotes;
    private Long totalDownvotes;
    private Long totalComments;
    private Long totalSaves;
    private Long totalPurchases;
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
  public static class PremiumBreakdown {
    private Long premiumCount;
    private Long freeCount;
  }
}

