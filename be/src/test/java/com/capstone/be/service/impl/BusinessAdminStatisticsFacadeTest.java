package com.capstone.be.service.impl;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import com.capstone.be.service.BaDashboardStatisticsService;
import com.capstone.be.service.BaDocumentStatisticsService;
import com.capstone.be.service.BaOrganizationStatisticsService;
import com.capstone.be.service.BaReportStatisticsService;
import com.capstone.be.service.BaUserStatisticsService;
import com.capstone.be.service.OrganizationStatisticsService;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Facade chuyển tiếp đúng chỗ.
 *
 * <p>Bốn trong sáu phương thức nhận cùng chữ ký {@code (Instant, Instant)} và trả về
 * bốn kiểu response khác nhau. Compiler bắt được lẫn kiểu trả về, nhưng KHÔNG bắt được
 * việc chuyển tiếp vào service sai nếu kiểu tình cờ khớp — test này kiểm từng cái gọi
 * đúng một service và không chạm các service khác.
 */
@ExtendWith(MockitoExtension.class)
class BusinessAdminStatisticsFacadeTest {

  @Mock private BaDashboardStatisticsService dashboardStatistics;
  @Mock private BaDocumentStatisticsService documentStatistics;
  @Mock private BaReportStatisticsService reportStatistics;
  @Mock private BaUserStatisticsService userStatistics;
  @Mock private BaOrganizationStatisticsService organizationStatistics;
  @Mock private OrganizationStatisticsService organizationStatisticsService;

  @InjectMocks private BusinessAdminStatisticsServiceImpl facade;

  private final Instant from = Instant.parse("2026-01-01T00:00:00Z");
  private final Instant to = Instant.parse("2026-02-01T00:00:00Z");

  @Test
  @DisplayName("Dashboard chỉ gọi BaDashboardStatisticsService")
  void dashboard() {
    facade.getDashboardOverview();

    verify(dashboardStatistics).getDashboardOverview();
    verifyNoInteractions(documentStatistics, reportStatistics, userStatistics,
        organizationStatistics, organizationStatisticsService);
  }

  @Test
  @DisplayName("Thống kê document chỉ gọi BaDocumentStatisticsService, truyền đúng khoảng ngày")
  void documents() {
    facade.getGlobalDocumentStatistics(from, to);

    verify(documentStatistics).getGlobalDocumentStatistics(eq(from), eq(to));
    verifyNoInteractions(dashboardStatistics, reportStatistics, userStatistics,
        organizationStatistics, organizationStatisticsService);
  }

  @Test
  @DisplayName("Thống kê báo cáo chỉ gọi BaReportStatisticsService")
  void reports() {
    facade.getReportHandlingStatistics(from, to);

    verify(reportStatistics).getReportHandlingStatistics(eq(from), eq(to));
    verifyNoInteractions(dashboardStatistics, documentStatistics, userStatistics,
        organizationStatistics, organizationStatisticsService);
  }

  @Test
  @DisplayName("Thống kê người dùng chỉ gọi BaUserStatisticsService")
  void users() {
    facade.getUserStatistics(from, to);

    verify(userStatistics).getUserStatistics(eq(from), eq(to));
    verifyNoInteractions(dashboardStatistics, documentStatistics, reportStatistics,
        organizationStatistics, organizationStatisticsService);
  }

  @Test
  @DisplayName("Thống kê tổ chức TOÀN HỆ THỐNG không bị lẫn với thống kê MỘT tổ chức")
  void globalOrganizationVsSingleOrganization() {
    facade.getGlobalOrganizationStatistics(from, to);

    verify(organizationStatistics).getGlobalOrganizationStatistics(eq(from), eq(to));
    // Đây là hai thứ khác nhau: một cái toàn hệ thống, một cái theo organizationId
    verify(organizationStatisticsService, never())
        .getOrganizationStatistics(any(), any(), any());
  }

  @Test
  @DisplayName("Thống kê một tổ chức chuyển tiếp sang OrganizationStatisticsService")
  void singleOrganization() {
    UUID orgId = UUID.randomUUID();

    facade.getOrganizationStatistics(orgId, from, to);

    verify(organizationStatisticsService)
        .getOrganizationStatistics(eq(orgId), eq(from), eq(to));
    verifyNoInteractions(organizationStatistics);
  }
}
