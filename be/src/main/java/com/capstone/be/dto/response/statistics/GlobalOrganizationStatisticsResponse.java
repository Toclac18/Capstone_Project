package com.capstone.be.dto.response.statistics;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for global organization statistics (BA - View Organization Statistics)
 * Focuses on overall organization participation, documents, and members
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GlobalOrganizationStatisticsResponse {

  // Summary statistics
  private SummaryStatistics summary;

  // Time series data
  private List<TimeSeriesData> organizationGrowth; // New organizations over time
  private List<TimeSeriesData> memberGrowth; // Total members across all organizations over time
  private List<TimeSeriesData> documentUploads; // Documents uploaded by organizations over time
  private List<TimeSeriesData> documentViews; // Views on organization documents over time

  // Breakdowns
  private List<OrganizationBreakdown> topOrganizations; // Top organizations by various metrics
  private List<TypeBreakdown> organizationTypeBreakdown; // Breakdown by organization type
  private List<MemberCountBreakdown> memberCountBreakdown; // Organizations by member count ranges

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class SummaryStatistics {
    private Long totalOrganizations;
    private Long totalMembers; // Total members across all organizations
    private Long totalDocuments; // Total documents from organizations
    private Long totalViews; // Total views on organization documents
    private Long totalUpvotes; // Total upvotes on organization documents
    private Long totalComments; // Total comments on organization documents
    private Long activeOrganizations; // Organizations with recent activity
    private Double averageMembersPerOrganization;
    private Double averageDocumentsPerOrganization;
    private Double averageViewsPerOrganization;
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
  public static class OrganizationBreakdown {
    private String organizationId;
    private String organizationName;
    private Long memberCount;
    private Long documentCount;
    private Long viewCount;
    private Long totalScore; // Combined score based on activity
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class TypeBreakdown {
    private String type;
    private Long count;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class MemberCountBreakdown {
    private String range; // e.g., "1-10", "11-50", "51-100", "100+"
    private Long count; // Number of organizations in this range
  }
}


