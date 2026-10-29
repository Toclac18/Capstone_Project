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
import com.capstone.be.service.BaDashboardStatisticsService;

/**
 * Thân các phương thức chuyển NGUYÊN VĂN từ BusinessAdminStatisticsServiceImpl.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BaDashboardStatisticsServiceImpl implements BaDashboardStatisticsService {

  private final DocumentRepository documentRepository;
  private final DocumentReportRepository documentReportRepository;
  private final UserRepository userRepository;
  private final OrganizationProfileRepository organizationProfileRepository;


  @Override
  @Transactional(readOnly = true)
  public BusinessAdminDashboardResponse getDashboardOverview() {
    // Get total counts
    long totalDocuments = documentRepository.count();
    long totalUsers = userRepository.count();
    long totalOrganizations = organizationProfileRepository.count();
    long totalReports = documentReportRepository.count();
    long pendingReports = documentReportRepository.countByStatus(ReportStatus.PENDING);

    // Get active users (users who have uploaded documents or have activity)
    long activeUsers = userRepository.count(
        (root, query, cb) -> {
          var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
          predicates.add(cb.equal(root.get("status"), UserStatus.ACTIVE));
          return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        });

    // Get active organizations (organizations with documents)
    long activeOrganizations = documentRepository.findAll().stream()
        .filter(doc -> doc.getOrganization() != null)
        .map(doc -> doc.getOrganization().getId())
        .distinct()
        .count();

    BusinessAdminDashboardResponse.OverviewStatistics overview = BusinessAdminDashboardResponse.OverviewStatistics.builder()
        .totalDocuments(totalDocuments)
        .totalUsers(totalUsers)
        .totalOrganizations(totalOrganizations)
        .totalReports(totalReports)
        .pendingReports(pendingReports)
        .activeUsers(activeUsers)
        .activeOrganizations(activeOrganizations)
        .build();

    // Get quick stats for today, this week, this month
    LocalDate today = LocalDate.now();
    LocalDate weekStart = today.minusDays(6);
    LocalDate monthStart = today.minusDays(29);

    Instant todayStart = today.atStartOfDay(ZoneId.systemDefault()).toInstant();
    Instant weekStartInstant = weekStart.atStartOfDay(ZoneId.systemDefault()).toInstant();
    Instant monthStartInstant = monthStart.atStartOfDay(ZoneId.systemDefault()).toInstant();
    Instant now = Instant.now();

    // Documents
    long documentsToday = documentRepository.count(
        (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), todayStart));
    long documentsThisWeek = documentRepository.count(
        (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), weekStartInstant));
    long documentsThisMonth = documentRepository.count(
        (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), monthStartInstant));

    // Reports
    long reportsToday = documentReportRepository.count(
        (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), todayStart));
    long reportsThisWeek = documentReportRepository.count(
        (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), weekStartInstant));
    long reportsThisMonth = documentReportRepository.count(
        (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), monthStartInstant));

    // New users
    long newUsersToday = userRepository.count(
        (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), todayStart));
    long newUsersThisWeek = userRepository.count(
        (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), weekStartInstant));
    long newUsersThisMonth = userRepository.count(
        (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), monthStartInstant));

    QuickStats quickStats = QuickStats.builder()
        .documentsToday(documentsToday)
        .documentsThisWeek(documentsThisWeek)
        .documentsThisMonth(documentsThisMonth)
        .reportsToday(reportsToday)
        .reportsThisWeek(reportsThisWeek)
        .reportsThisMonth(reportsThisMonth)
        .newUsersToday(newUsersToday)
        .newUsersThisWeek(newUsersThisWeek)
        .newUsersThisMonth(newUsersThisMonth)
        .build();

    return BusinessAdminDashboardResponse.builder()
        .overview(overview)
        .quickStats(quickStats)
        .build();
  }
}
