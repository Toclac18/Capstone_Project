package com.capstone.be.dto.response.statistics;

import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Lightweight response DTO for homepage trending reviewers
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HomepageTrendingReviewersResponse {

  private List<TrendingReviewer> reviewers;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class TrendingReviewer {
    private UUID id;
    private String fullName;
    private String avatarUrl;
    private String organizationName;
    private Long totalReviewsSubmitted;
    private Double approvalRate;
    private Double performanceScore;
  }
}
