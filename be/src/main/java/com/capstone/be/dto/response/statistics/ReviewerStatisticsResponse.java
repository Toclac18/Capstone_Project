package com.capstone.be.dto.response.statistics;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Response DTO for Reviewer Statistics
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewerStatisticsResponse {

  /**
   * Summary statistics
   */
  private Summary summary;

  /**
   * Review request status breakdown
   */
  private Map<String, Long> reviewRequestStatusBreakdown;

  /**
   * Review decision breakdown (APPROVED/REJECTED)
   */
  private Map<String, Long> reviewDecisionBreakdown;

  /**
   * Reviews by month (for chart)
   */
  private Map<String, Long> reviewsByMonth;

  /**
   * Average review time in days
   */
  private Double averageReviewTimeDays;

  /**
   * Summary statistics
   */
  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class Summary {
    /**
     * Total review requests received
     */
    private Long totalReviewRequests;

    /**
     * Total reviews completed
     */
    private Long totalReviewsCompleted;

    /**
     * Total reviews approved
     */
    private Long totalReviewsApproved;

    /**
     * Total reviews rejected
     */
    private Long totalReviewsRejected;

    /**
     * Pending review requests (not yet accepted/rejected)
     */
    private Long pendingReviewRequests;

    /**
     * Accepted review requests (in progress)
     */
    private Long acceptedReviewRequests;

    /**
     * Rejected review requests
     */
    private Long rejectedReviewRequests;

    /**
     * Expired review requests
     */
    private Long expiredReviewRequests;

    /**
     * Completed review requests
     */
    private Long completedReviewRequests;
  }
}


