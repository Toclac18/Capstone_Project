package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.Comment;
import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.DocumentReadHistory;
import com.capstone.be.domain.entity.DocumentRedemption;
import com.capstone.be.domain.entity.DocumentReport;
import com.capstone.be.domain.entity.DocumentVote;
import com.capstone.be.domain.entity.OrgEnrollment;
import com.capstone.be.domain.entity.OrganizationProfile;
import com.capstone.be.domain.entity.SavedListDocument;
import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.DocVisibility;
import com.capstone.be.domain.enums.ReportReason;
import com.capstone.be.domain.enums.ReportStatus;
import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.domain.enums.UserStatus;
import com.capstone.be.dto.response.statistics.BusinessAdminDashboardResponse;
import com.capstone.be.dto.response.statistics.BusinessAdminDashboardResponse.OverviewStatistics;
import com.capstone.be.dto.response.statistics.BusinessAdminDashboardResponse.QuickStats;
import com.capstone.be.dto.response.statistics.GlobalDocumentStatisticsResponse;
import com.capstone.be.dto.response.statistics.GlobalDocumentStatisticsResponse.OrganizationBreakdown;
import com.capstone.be.dto.response.statistics.GlobalDocumentStatisticsResponse.PremiumBreakdown;
import com.capstone.be.dto.response.statistics.GlobalDocumentStatisticsResponse.TypeBreakdown;
import com.capstone.be.dto.response.statistics.ReportHandlingStatisticsResponse;
import com.capstone.be.dto.response.statistics.ReportHandlingStatisticsResponse.ReasonBreakdown;
import com.capstone.be.dto.response.statistics.ReportHandlingStatisticsResponse.ResolutionTimeBreakdown;
import com.capstone.be.repository.CommentRepository;
import com.capstone.be.repository.DocTypeRepository;
import com.capstone.be.repository.DocumentReadHistoryRepository;
import com.capstone.be.repository.DocumentRedemptionRepository;
import com.capstone.be.repository.DocumentReportRepository;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.DocumentVoteRepository;
import com.capstone.be.repository.OrgEnrollmentRepository;
import com.capstone.be.repository.OrganizationProfileRepository;
import com.capstone.be.repository.SavedListDocumentRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.service.BusinessAdminStatisticsService;
import com.capstone.be.service.OrganizationStatisticsService;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.capstone.be.service.BaReportStatisticsService;

/**
 * Thân các phương thức chuyển NGUYÊN VĂN từ BusinessAdminStatisticsServiceImpl.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BaReportStatisticsServiceImpl implements BaReportStatisticsService {

  /** Dùng chung cho mọi chuỗi thống kê theo ngày. */
  private static final DateTimeFormatter DATE_FORMATTER =
      DateTimeFormatter.ofPattern("yyyy-MM-dd");

  private final DocumentReportRepository documentReportRepository;


  @Override
  @Transactional(readOnly = true)
  public ReportHandlingStatisticsResponse getReportHandlingStatistics(
      Instant startDate, Instant endDate) {
    log.info("Getting report handling statistics from {} to {}", startDate, endDate);

    // Get all reports with date filter
    Specification<DocumentReport> reportSpec = (root, query, cb) -> {
      var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
      if (startDate != null) {
        predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
      }
      if (endDate != null) {
        predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
      }
      return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
    };

    List<DocumentReport> allReports = documentReportRepository.findAll(reportSpec);

    // Calculate summary statistics
    ReportHandlingStatisticsResponse.SummaryStatistics summary = calculateReportSummary(allReports);

    // Calculate time series data
    List<ReportHandlingStatisticsResponse.TimeSeriesData> reportsCreated = calculateReportsCreatedTimeSeries(allReports, startDate,
        endDate);
    List<ReportHandlingStatisticsResponse.TimeSeriesData> reportsResolved = calculateReportsResolvedTimeSeries(allReports, startDate,
        endDate);
    List<ReportHandlingStatisticsResponse.TimeSeriesData> reportsRejected = calculateReportsRejectedTimeSeries(allReports, startDate,
        endDate);

    // Calculate breakdowns
    List<ReportHandlingStatisticsResponse.StatusBreakdown> statusBreakdown = calculateReportStatusBreakdown(allReports);
    List<ReasonBreakdown> reasonBreakdown = calculateReasonBreakdown(allReports);
    List<ResolutionTimeBreakdown> resolutionTimeBreakdown = calculateResolutionTimeBreakdown(
        allReports);

    return ReportHandlingStatisticsResponse.builder()
        .summary(summary)
        .reportsCreated(reportsCreated)
        .reportsResolved(reportsResolved)
        .reportsRejected(reportsRejected)
        .statusBreakdown(statusBreakdown)
        .reasonBreakdown(reasonBreakdown)
        .resolutionTimeBreakdown(resolutionTimeBreakdown)
        .build();
  }

  // Common helper method for Report Handling Statistics
  private List<ReportHandlingStatisticsResponse.TimeSeriesData> buildReportTimeSeries(Map<String, Long> dateCounts, Instant startDate,
      Instant endDate) {
    LocalDate start = startDate != null
        ? startDate.atZone(ZoneId.systemDefault()).toLocalDate()
        : LocalDate.now().minusMonths(6);
    LocalDate end = endDate != null
        ? endDate.atZone(ZoneId.systemDefault()).toLocalDate()
        : LocalDate.now();

    List<ReportHandlingStatisticsResponse.TimeSeriesData> series = new ArrayList<>();
    LocalDate current = start;
    while (!current.isAfter(end)) {
      String dateStr = current.format(DATE_FORMATTER);
      series.add(ReportHandlingStatisticsResponse.TimeSeriesData.builder()
          .date(dateStr)
          .count(dateCounts.getOrDefault(dateStr, 0L))
          .build());
      current = current.plusDays(1);
    }

    return series;
  }

  private List<ReasonBreakdown> calculateReasonBreakdown(List<DocumentReport> reports) {
    Map<ReportReason, Long> reasonCounts = reports.stream()
        .collect(Collectors.groupingBy(DocumentReport::getReason, Collectors.counting()));

    return reasonCounts.entrySet().stream()
        .map(entry -> ReasonBreakdown.builder()
            .reason(entry.getKey().name())
            .count(entry.getValue())
            .build())
        .collect(Collectors.toList());
  }

  private List<ReportHandlingStatisticsResponse.StatusBreakdown> calculateReportStatusBreakdown(List<DocumentReport> reports) {
    Map<ReportStatus, Long> statusCounts = reports.stream()
        .collect(Collectors.groupingBy(DocumentReport::getStatus, Collectors.counting()));

    return statusCounts.entrySet().stream()
        .map(entry -> ReportHandlingStatisticsResponse.StatusBreakdown.builder()
            .status(entry.getKey().name())
            .count(entry.getValue())
            .build())
        .collect(Collectors.toList());
  }

  private ReportHandlingStatisticsResponse.SummaryStatistics calculateReportSummary(
      List<DocumentReport> reports) {
    long totalReports = reports.size();
    long pendingReports = reports.stream()
        .filter(r -> r.getStatus() == ReportStatus.PENDING)
        .count();
    long inReviewReports = 0; // Deprecated - only PENDING and RESOLVED now
    long resolvedReports = reports.stream()
        .filter(r -> r.getStatus() == ReportStatus.RESOLVED)
        .count();
    long rejectedReports = 0; // Deprecated - only PENDING and RESOLVED now
    long closedReports = 0; // Deprecated - only PENDING and RESOLVED now

    // Calculate average resolution time (for resolved reports)
    List<DocumentReport> resolved = reports.stream()
        .filter(r -> r.getStatus() == ReportStatus.RESOLVED && r.getUpdatedAt() != null)
        .collect(Collectors.toList());

    double avgResolutionTime = 0.0;
    if (!resolved.isEmpty()) {
      double totalHours = resolved.stream()
          .mapToDouble(r -> {
            Duration duration = Duration.between(r.getCreatedAt(), r.getUpdatedAt());
            return duration.toHours();
          })
          .sum();
      avgResolutionTime = totalHours / resolved.size();
    }

    // Get reports for this month and last month
    LocalDate now = LocalDate.now();
    LocalDate thisMonthStart = now.withDayOfMonth(1);
    LocalDate lastMonthStart = thisMonthStart.minusMonths(1);
    LocalDate lastMonthEnd = thisMonthStart.minusDays(1);

    Instant thisMonthStartInstant = thisMonthStart.atStartOfDay(ZoneId.systemDefault())
        .toInstant();
    Instant lastMonthStartInstant = lastMonthStart.atStartOfDay(ZoneId.systemDefault())
        .toInstant();
    Instant lastMonthEndInstant = lastMonthEnd.atTime(23, 59, 59).atZone(ZoneId.systemDefault())
        .toInstant();

    long totalReportsThisMonth = reports.stream()
        .filter(r -> r.getCreatedAt().isAfter(thisMonthStartInstant) || r.getCreatedAt()
            .equals(thisMonthStartInstant))
        .count();

    long totalReportsLastMonth = reports.stream()
        .filter(r -> (r.getCreatedAt().isAfter(lastMonthStartInstant) || r.getCreatedAt()
            .equals(lastMonthStartInstant))
            && (r.getCreatedAt().isBefore(lastMonthEndInstant) || r.getCreatedAt()
                .equals(lastMonthEndInstant)))
        .count();

    return ReportHandlingStatisticsResponse.SummaryStatistics.builder()
        .totalReports(totalReports)
        .pendingReports(pendingReports)
        .inReviewReports(inReviewReports)
        .resolvedReports(resolvedReports)
        .rejectedReports(rejectedReports)
        .closedReports(closedReports)
        .averageResolutionTime(avgResolutionTime)
        .totalReportsThisMonth(totalReportsThisMonth)
        .totalReportsLastMonth(totalReportsLastMonth)
        .build();
  }

  private List<ReportHandlingStatisticsResponse.TimeSeriesData> calculateReportsCreatedTimeSeries(List<DocumentReport> reports,
      Instant startDate, Instant endDate) {
    Map<String, Long> dateCounts = new HashMap<>();

    for (DocumentReport report : reports) {
      LocalDate date = report.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate();
      String dateStr = date.format(DATE_FORMATTER);
      dateCounts.put(dateStr, dateCounts.getOrDefault(dateStr, 0L) + 1);
    }

    return buildReportTimeSeries(dateCounts, startDate, endDate);
  }

  private List<ReportHandlingStatisticsResponse.TimeSeriesData> calculateReportsRejectedTimeSeries(List<DocumentReport> reports,
      Instant startDate, Instant endDate) {
    // Deprecated - only PENDING and RESOLVED status now
    Map<String, Long> dateCounts = new HashMap<>();
    return buildReportTimeSeries(dateCounts, startDate, endDate);
  }

  private List<ReportHandlingStatisticsResponse.TimeSeriesData> calculateReportsResolvedTimeSeries(List<DocumentReport> reports,
      Instant startDate, Instant endDate) {
    Map<String, Long> dateCounts = new HashMap<>();

    for (DocumentReport report : reports) {
      if (report.getStatus() == ReportStatus.RESOLVED && report.getUpdatedAt() != null) {
        LocalDate date = report.getUpdatedAt().atZone(ZoneId.systemDefault()).toLocalDate();
        String dateStr = date.format(DATE_FORMATTER);
        dateCounts.put(dateStr, dateCounts.getOrDefault(dateStr, 0L) + 1);
      }
    }

    return buildReportTimeSeries(dateCounts, startDate, endDate);
  }

  private List<ResolutionTimeBreakdown> calculateResolutionTimeBreakdown(
      List<DocumentReport> reports) {
    List<DocumentReport> resolved = reports.stream()
        .filter(r -> r.getStatus() == ReportStatus.RESOLVED && r.getUpdatedAt() != null)
        .collect(Collectors.toList());

    long lessThan24Hours = 0;
    long oneToThreeDays = 0;
    long moreThanThreeDays = 0;

    for (DocumentReport report : resolved) {
      Duration duration = Duration.between(report.getCreatedAt(), report.getUpdatedAt());
      long hours = duration.toHours();

      if (hours < 24) {
        lessThan24Hours++;
      } else if (hours <= 72) {
        oneToThreeDays++;
      } else {
        moreThanThreeDays++;
      }
    }

    List<ResolutionTimeBreakdown> breakdown = new ArrayList<>();
    breakdown.add(ResolutionTimeBreakdown.builder()
        .timeRange("< 24 hours")
        .count(lessThan24Hours)
        .build());
    breakdown.add(ResolutionTimeBreakdown.builder()
        .timeRange("1-3 days")
        .count(oneToThreeDays)
        .build());
    breakdown.add(ResolutionTimeBreakdown.builder()
        .timeRange("> 3 days")
        .count(moreThanThreeDays)
        .build());

    return breakdown;
  }
}
