package com.capstone.be.dto.response.statistics;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for System Admin Dashboard Statistics
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemAdminDashboardResponse {

  // System Overview
  private OverviewStatistics overview;

  // Access Statistics (STA7 - View Access Statistics)
  private AccessStatistics accessStatistics;

  // User Activity Statistics
  private UserActivityStatistics userActivity;

  // System Activity
  private SystemActivityStatistics systemActivity;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class OverviewStatistics {
    private Long totalUsers;
    private Long totalOrganizations;
    private Long totalDocuments;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class AccessStatistics {
    // Login trends over time
    private List<TimeSeriesData> loginSuccessTrend;
    private List<TimeSeriesData> loginFailedTrend;
    
    // Active users (users who logged in within time period)
    private List<TimeSeriesData> activeUsersTrend; // DAU/MAU
    
    // Summary
    private Long totalLoginsToday;
    private Long totalLoginsThisWeek;
    private Long totalLoginsThisMonth;
    private Long failedLoginsToday;
    private Long failedLoginsThisWeek;
    private Long failedLoginsThisMonth;
    private Long activeUsersLast7Days; // Users who logged in last 7 days
    private Long activeUsersLast30Days; // Users who logged in last 30 days
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class UserActivityStatistics {
    // User growth by role over time
    private List<RoleGrowthData> userGrowthByRole;
    
    // User status distribution
    private List<StatusBreakdown> userStatusBreakdown;
    
    // New users registration over time
    private List<TimeSeriesData> newUsersRegistration;
    
    // Summary
    private Long totalReaders;
    private Long totalReviewers;
    private Long totalOrganizationAdmins;
    private Long totalBusinessAdmins;
    private Long newUsersToday;
    private Long newUsersThisWeek;
    private Long newUsersThisMonth;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class SystemActivityStatistics {
    // Documents uploaded over time
    private List<TimeSeriesData> documentsUploaded;
    
    // Organizations created over time
    private List<TimeSeriesData> organizationsCreated;
    
    // System actions from logs
    private List<ActionBreakdown> systemActionsBreakdown;
    private List<TimeSeriesData> systemActionsTrend;
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
  public static class RoleGrowthData {
    private String role;
    private List<TimeSeriesData> growth;
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
  public static class ActionBreakdown {
    private String action;
    private Long count;
  }
}


