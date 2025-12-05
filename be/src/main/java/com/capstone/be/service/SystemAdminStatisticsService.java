package com.capstone.be.service;

import com.capstone.be.dto.response.statistics.SystemAdminDashboardResponse;
import java.time.Instant;

/**
 * Service interface for System Admin statistics operations
 */
public interface SystemAdminStatisticsService {

  /**
   * Get System Admin dashboard statistics
   *
   * @param startDate Optional start date filter (ISO format)
   * @param endDate   Optional end date filter (ISO format)
   * @return System Admin dashboard response
   */
  SystemAdminDashboardResponse getDashboardStatistics(Instant startDate, Instant endDate);
}

