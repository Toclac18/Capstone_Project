package com.capstone.be.service;

import com.capstone.be.dto.response.statistics.PersonalDocumentStatisticsResponse;
import java.time.Instant;
import java.util.UUID;

/**
 * Service interface for personal document statistics operations
 */
public interface PersonalStatisticsService {

  /**
   * Get personal document statistics for a user (STA1)
   *
   * @param userId   User ID
   * @param startDate Optional start date filter (ISO format)
   * @param endDate   Optional end date filter (ISO format)
   * @return Personal document statistics response
   */
  PersonalDocumentStatisticsResponse getPersonalDocumentStatistics(
      UUID userId, Instant startDate, Instant endDate);
}

