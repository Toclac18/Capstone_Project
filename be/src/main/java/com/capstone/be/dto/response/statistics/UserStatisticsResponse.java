package com.capstone.be.dto.response.statistics;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for user statistics (Business Admin - View User Participation Statistics)
 * Focuses on user participation numbers and growth trends
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserStatisticsResponse {

  // Summary statistics
  private SummaryStatistics summary;

  // Time series data for growth trends
  private List<TimeSeriesData> userGrowth; // New users registered over time
  private List<TimeSeriesData> activeUsersGrowth; // Active users over time

  // Breakdown by role
  private List<RoleBreakdown> roleBreakdown;

  // Breakdown by status
  private List<StatusBreakdown> statusBreakdown;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class SummaryStatistics {
    private Long totalUsers;
    private Long activeUsers;
    private Long inactiveUsers;
    private Long pendingVerificationUsers;
    private Long totalReaders;
    private Long totalReviewers;
    private Long totalOrganizationAdmins;
    private Long newUsersThisMonth;
    private Long newUsersLastMonth;
    private Double growthRate; // Percentage growth compared to last month
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
  public static class RoleBreakdown {
    private String role;
    private Long total;
    private Long active;
    private Long inactive;
    private Long pendingVerification;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class StatusBreakdown {
    private String status;
    private Long count;
  }
}


