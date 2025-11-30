package com.capstone.be.dto.response.statistics;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for report handling statistics (View Report Handling Statistics)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportHandlingStatisticsResponse {

  // Summary statistics
  private SummaryStatistics summary;

  // Time series data
  private List<TimeSeriesData> reportsCreated;
  private List<TimeSeriesData> reportsResolved;
  private List<TimeSeriesData> reportsRejected;

  // Breakdowns
  private List<StatusBreakdown> statusBreakdown;
  private List<ReasonBreakdown> reasonBreakdown;
  private List<ResolutionTimeBreakdown> resolutionTimeBreakdown;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class SummaryStatistics {
    private Long totalReports;
    private Long pendingReports;
    private Long inReviewReports;
    private Long resolvedReports;
    private Long rejectedReports;
    private Long closedReports;
    private Double averageResolutionTime; // in hours
    private Long totalReportsThisMonth;
    private Long totalReportsLastMonth;
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
  public static class ReasonBreakdown {
    private String reason;
    private Long count;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class ResolutionTimeBreakdown {
    private String timeRange; // e.g., "< 24 hours", "1-3 days", "> 3 days"
    private Long count;
  }
}

