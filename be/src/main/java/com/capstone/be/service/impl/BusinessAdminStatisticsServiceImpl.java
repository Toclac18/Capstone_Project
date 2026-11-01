package com.capstone.be.service.impl;

import com.capstone.be.dto.response.statistics.BusinessAdminDashboardResponse;
import com.capstone.be.dto.response.statistics.GlobalDocumentStatisticsResponse;
import com.capstone.be.dto.response.statistics.GlobalOrganizationStatisticsResponse;
import com.capstone.be.dto.response.statistics.OrganizationStatisticsResponse;
import com.capstone.be.dto.response.statistics.ReportHandlingStatisticsResponse;
import com.capstone.be.dto.response.statistics.UserStatisticsResponse;
import com.capstone.be.service.BaDashboardStatisticsService;
import com.capstone.be.service.BaDocumentStatisticsService;
import com.capstone.be.service.BaOrganizationStatisticsService;
import com.capstone.be.service.BaReportStatisticsService;
import com.capstone.be.service.BaUserStatisticsService;
import com.capstone.be.service.BusinessAdminStatisticsService;
import com.capstone.be.service.OrganizationStatisticsService;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

/**
 * Facade giữ nguyên {@link BusinessAdminStatisticsService} để {@code StatisticsController}
 * không phải đổi.
 *
 * <p>Lớp cũ gộp sáu nhóm thống kê không liên quan nhau trong 1.429 dòng. Phép đo cho
 * thấy đây là ca tách sạch nhất trong các service đã làm: <b>không một phương thức
 * riêng nào được dùng chung giữa hai nhóm</b> — cả 36 helper đều thuộc đúng một nhóm.
 *
 * <p>Nhờ vậy 12 phụ thuộc chia thành 4, 6, 1, 1, 5 — hai service chỉ cần MỘT repository.
 *
 * <p>{@code getOrganizationStatistics} vốn đã chỉ chuyển tiếp sang
 * {@link OrganizationStatisticsService}, nên nó chuyển tiếp thẳng từ đây.
 *
 * <p>KHÔNG đặt @Transactional ở đây: transaction boundary thuộc các service kia.
 */
@Service
@RequiredArgsConstructor
public class BusinessAdminStatisticsServiceImpl implements BusinessAdminStatisticsService {

  private final BaDashboardStatisticsService dashboardStatistics;
  private final BaDocumentStatisticsService documentStatistics;
  private final BaReportStatisticsService reportStatistics;
  private final BaUserStatisticsService userStatistics;
  private final BaOrganizationStatisticsService organizationStatistics;
  private final OrganizationStatisticsService organizationStatisticsService;

  @Override
  public BusinessAdminDashboardResponse getDashboardOverview() {
    return dashboardStatistics.getDashboardOverview();
  }

  @Override
  public GlobalDocumentStatisticsResponse getGlobalDocumentStatistics(
      Instant startDate, Instant endDate) {
    return documentStatistics.getGlobalDocumentStatistics(startDate, endDate);
  }

  @Override
  public ReportHandlingStatisticsResponse getReportHandlingStatistics(
      Instant startDate, Instant endDate) {
    return reportStatistics.getReportHandlingStatistics(startDate, endDate);
  }

  @Override
  public UserStatisticsResponse getUserStatistics(Instant startDate, Instant endDate) {
    return userStatistics.getUserStatistics(startDate, endDate);
  }

  @Override
  public GlobalOrganizationStatisticsResponse getGlobalOrganizationStatistics(
      Instant startDate, Instant endDate) {
    return organizationStatistics.getGlobalOrganizationStatistics(startDate, endDate);
  }

  @Override
  public OrganizationStatisticsResponse getOrganizationStatistics(
      UUID organizationId, Instant startDate, Instant endDate) {
    // Vốn đã chỉ chuyển tiếp từ trước — xem OrganizationStatisticsService
    return organizationStatisticsService.getOrganizationStatistics(
        organizationId, startDate, endDate);
  }
}
