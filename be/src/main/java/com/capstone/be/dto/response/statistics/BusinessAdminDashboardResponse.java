package com.capstone.be.dto.response.statistics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for Business Admin Dashboard (overview)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BusinessAdminDashboardResponse {

  // Overview statistics
  private OverviewStatistics overview;

  // Quick stats
  private QuickStats quickStats;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class OverviewStatistics {
    private Long totalDocuments;
    private Long totalUsers;
    private Long totalOrganizations;
    private Long totalReports;
    private Long pendingReports;
    private Long activeUsers;
    private Long activeOrganizations;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class QuickStats {
    private Long documentsToday;
    private Long documentsThisWeek;
    private Long documentsThisMonth;
    private Long reportsToday;
    private Long reportsThisWeek;
    private Long reportsThisMonth;
    private Long newUsersToday;
    private Long newUsersThisWeek;
    private Long newUsersThisMonth;
  }
}

