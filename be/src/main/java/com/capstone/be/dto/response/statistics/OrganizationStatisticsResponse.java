package com.capstone.be.dto.response.statistics;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for organization statistics (STA3 & STA6)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationStatisticsResponse {

  // Organization information
  private OrganizationInfo organization;

  // Summary statistics
  private SummaryStatistics summary;

  // Time series data
  private List<TimeSeriesData> memberGrowth;
  private List<TimeSeriesData> documentUploads;
  private List<TimeSeriesData> documentViews;
  private List<TimeSeriesData> votesReceived;
  private List<TimeSeriesData> commentsReceived;
  private List<TimeSeriesData> documentsSaved;

  // Breakdowns
  private List<StatusBreakdown> memberStatusBreakdown;
  private List<StatusBreakdown> documentStatusBreakdown;
  private List<VisibilityBreakdown> documentVisibilityBreakdown;
  private PremiumBreakdown premiumBreakdown;
  private List<TopContributor> topContributors;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class OrganizationInfo {
    private String id;
    private String name;
    private String type;
    private String email;
    private String createdAt;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class SummaryStatistics {
    private Long totalMembers;
    private Long totalDocuments;
    private Long totalViews;
    private Long totalUpvotes;
    private Long totalDownvotes;
    private Long totalComments;
    private Long totalSaves;
    private Long totalPurchases;
    private Long activeMembers;
    private Double averageViewsPerDocument;
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
  public static class TopContributor {
    private String memberId;
    private String memberName;
    private String memberEmail;
    private Long uploadCount;
  }
}

