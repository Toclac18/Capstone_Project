package com.capstone.be.service;

import com.capstone.be.dto.response.statistics.ReviewerStatisticsResponse;
import java.time.Instant;
import java.util.UUID;

/**
 * Service interface for Reviewer statistics operations
 */
public interface ReviewerStatisticsService {

  /**
   * Get reviewer statistics
   *
   * @param reviewerId Reviewer ID
   * @param startDate  Optional start date filter (ISO format)
   * @param endDate    Optional end date filter (ISO format)
   * @return Reviewer statistics response
   */
  ReviewerStatisticsResponse getReviewerStatistics(
      UUID reviewerId, Instant startDate, Instant endDate);
}


