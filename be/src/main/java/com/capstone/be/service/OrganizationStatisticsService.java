package com.capstone.be.service;

import com.capstone.be.dto.response.statistics.OrganizationStatisticsResponse;
import java.time.Instant;
import java.util.UUID;

/**
 * Service interface for organization statistics operations
 */
public interface OrganizationStatisticsService {

  /**
   * Get organization statistics (STA3 & STA6)
   *
   * @param organizationId Organization ID
   * @param startDate      Optional start date filter (ISO format)
   * @param endDate        Optional end date filter (ISO format)
   * @return Organization statistics response
   */
  OrganizationStatisticsResponse getOrganizationStatistics(
      UUID organizationId, Instant startDate, Instant endDate);
}

