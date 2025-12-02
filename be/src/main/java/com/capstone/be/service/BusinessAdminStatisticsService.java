package com.capstone.be.service;

import com.capstone.be.dto.response.statistics.BusinessAdminDashboardResponse;
import com.capstone.be.dto.response.statistics.GlobalDocumentStatisticsResponse;
import com.capstone.be.dto.response.statistics.ReportHandlingStatisticsResponse;
import java.time.Instant;
import java.util.UUID;

/**
 * Service interface for Business Admin statistics operations
 */
public interface BusinessAdminStatisticsService {

  /**
   * Get dashboard overview statistics
   *
   * @return Dashboard overview response
   */
  BusinessAdminDashboardResponse getDashboardOverview();

  /**
   * Get global document statistics (View Global Document Statistics)
   *
   * @param startDate Optional start date filter (ISO format)
   * @param endDate   Optional end date filter (ISO format)
   * @return Global document statistics response
   */
  GlobalDocumentStatisticsResponse getGlobalDocumentStatistics(
      Instant startDate, Instant endDate);

  /**
   * Get report handling statistics (View Report Handling Statistics)
   *
   * @param startDate Optional start date filter (ISO format)
   * @param endDate   Optional end date filter (ISO format)
   * @return Report handling statistics response
   */
  ReportHandlingStatisticsResponse getReportHandlingStatistics(
      Instant startDate, Instant endDate);

  /**
   * Get organization statistics (BA - View Organization Statistics)
   * This delegates to OrganizationStatisticsService
   *
   * @param organizationId Organization ID
   * @param startDate      Optional start date filter (ISO format)
   * @param endDate        Optional end date filter (ISO format)
   * @return Organization statistics response
   */
  com.capstone.be.dto.response.statistics.OrganizationStatisticsResponse getOrganizationStatistics(
      UUID organizationId, Instant startDate, Instant endDate);
}

