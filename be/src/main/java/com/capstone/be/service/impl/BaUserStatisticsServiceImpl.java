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
import com.capstone.be.service.BaUserStatisticsService;

/**
 * Thân các phương thức chuyển NGUYÊN VĂN từ BusinessAdminStatisticsServiceImpl.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BaUserStatisticsServiceImpl implements BaUserStatisticsService {

  /** Dùng chung cho mọi chuỗi thống kê theo ngày. */
  private static final DateTimeFormatter DATE_FORMATTER =
      DateTimeFormatter.ofPattern("yyyy-MM-dd");

  private final UserRepository userRepository;


  @Override
  @Transactional(readOnly = true)
  public com.capstone.be.dto.response.statistics.UserStatisticsResponse getUserStatistics(
      Instant startDate, Instant endDate) {
    log.info("Getting user statistics from {} to {}", startDate, endDate);

    // Get all users with date filter (exclude SYSTEM_ADMIN and BUSINESS_ADMIN)
    Specification<com.capstone.be.domain.entity.User> userSpec = (root, query, cb) -> {
      var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
      predicates.add(cb.notEqual(root.get("role"), com.capstone.be.domain.enums.UserRole.SYSTEM_ADMIN));
      predicates.add(cb.notEqual(root.get("role"), com.capstone.be.domain.enums.UserRole.BUSINESS_ADMIN));
      if (startDate != null) {
        predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
      }
      if (endDate != null) {
        predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
      }
      return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
    };

    List<com.capstone.be.domain.entity.User> allUsers = userRepository.findAll(userSpec);

    // Calculate summary statistics
    com.capstone.be.dto.response.statistics.UserStatisticsResponse.SummaryStatistics summary = calculateUserSummaryStatistics(allUsers);

    // Calculate time series data
    List<com.capstone.be.dto.response.statistics.UserStatisticsResponse.TimeSeriesData> userGrowth = calculateUserGrowthTimeSeries(allUsers, startDate, endDate);
    List<com.capstone.be.dto.response.statistics.UserStatisticsResponse.TimeSeriesData> activeUsersGrowth = calculateActiveUsersGrowthTimeSeries(allUsers, startDate, endDate);

    // Calculate breakdowns
    List<com.capstone.be.dto.response.statistics.UserStatisticsResponse.RoleBreakdown> roleBreakdown = calculateRoleBreakdown(allUsers);
    List<com.capstone.be.dto.response.statistics.UserStatisticsResponse.StatusBreakdown> statusBreakdown = calculateUserStatusBreakdown(allUsers);

    return com.capstone.be.dto.response.statistics.UserStatisticsResponse.builder()
        .summary(summary)
        .userGrowth(userGrowth)
        .activeUsersGrowth(activeUsersGrowth)
        .roleBreakdown(roleBreakdown)
        .statusBreakdown(statusBreakdown)
        .build();
  }

  private List<com.capstone.be.dto.response.statistics.UserStatisticsResponse.TimeSeriesData> buildUserTimeSeries(
      Map<String, Long> dateCounts, Instant startDate, Instant endDate) {
    LocalDate start = startDate != null
        ? startDate.atZone(ZoneId.systemDefault()).toLocalDate()
        : LocalDate.now().minusMonths(6);
    LocalDate end = endDate != null
        ? endDate.atZone(ZoneId.systemDefault()).toLocalDate()
        : LocalDate.now();

    List<com.capstone.be.dto.response.statistics.UserStatisticsResponse.TimeSeriesData> series = new ArrayList<>();
    LocalDate current = start;
    while (!current.isAfter(end)) {
      String dateStr = current.format(DATE_FORMATTER);
      series.add(com.capstone.be.dto.response.statistics.UserStatisticsResponse.TimeSeriesData.builder()
          .date(dateStr)
          .count(dateCounts.getOrDefault(dateStr, 0L))
          .build());
      current = current.plusDays(1);
    }

    return series;
  }

  private List<com.capstone.be.dto.response.statistics.UserStatisticsResponse.TimeSeriesData> calculateActiveUsersGrowthTimeSeries(
      List<com.capstone.be.domain.entity.User> users, Instant startDate, Instant endDate) {
    // For active users growth, we count users who became active (status changed to ACTIVE) over time
    // Since we don't track status change history, we'll use created date for active users
    Map<String, Long> dateCounts = new HashMap<>();

    for (com.capstone.be.domain.entity.User user : users) {
      if (user.getStatus() == com.capstone.be.domain.enums.UserStatus.ACTIVE) {
        LocalDate date = user.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate();
        String dateStr = date.format(DATE_FORMATTER);
        dateCounts.put(dateStr, dateCounts.getOrDefault(dateStr, 0L) + 1);
      }
    }

    return buildUserTimeSeries(dateCounts, startDate, endDate);
  }

  private List<com.capstone.be.dto.response.statistics.UserStatisticsResponse.RoleBreakdown> calculateRoleBreakdown(
      List<com.capstone.be.domain.entity.User> users) {
    Map<com.capstone.be.domain.enums.UserRole, List<com.capstone.be.domain.entity.User>> usersByRole = users.stream()
        .collect(Collectors.groupingBy(com.capstone.be.domain.entity.User::getRole));

    List<com.capstone.be.dto.response.statistics.UserStatisticsResponse.RoleBreakdown> breakdown = new ArrayList<>();

    for (Map.Entry<com.capstone.be.domain.enums.UserRole, List<com.capstone.be.domain.entity.User>> entry : usersByRole.entrySet()) {
      com.capstone.be.domain.enums.UserRole role = entry.getKey();
      List<com.capstone.be.domain.entity.User> roleUsers = entry.getValue();

      long total = roleUsers.size();
      long active = roleUsers.stream()
          .filter(u -> u.getStatus() == com.capstone.be.domain.enums.UserStatus.ACTIVE)
          .count();
      long inactive = roleUsers.stream()
          .filter(u -> u.getStatus() == com.capstone.be.domain.enums.UserStatus.INACTIVE)
          .count();
      long pendingVerification = roleUsers.stream()
          .filter(u -> u.getStatus() == com.capstone.be.domain.enums.UserStatus.PENDING_EMAIL_VERIFY
              || u.getStatus() == com.capstone.be.domain.enums.UserStatus.PENDING_APPROVE)
          .count();

      breakdown.add(com.capstone.be.dto.response.statistics.UserStatisticsResponse.RoleBreakdown.builder()
          .role(role.name())
          .total(total)
          .active(active)
          .inactive(inactive)
          .pendingVerification(pendingVerification)
          .build());
    }

    return breakdown;
  }

  private List<com.capstone.be.dto.response.statistics.UserStatisticsResponse.TimeSeriesData> calculateUserGrowthTimeSeries(
      List<com.capstone.be.domain.entity.User> users, Instant startDate, Instant endDate) {
    Map<String, Long> dateCounts = new HashMap<>();

    for (com.capstone.be.domain.entity.User user : users) {
      LocalDate date = user.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate();
      String dateStr = date.format(DATE_FORMATTER);
      dateCounts.put(dateStr, dateCounts.getOrDefault(dateStr, 0L) + 1);
    }

    return buildUserTimeSeries(dateCounts, startDate, endDate);
  }

  private List<com.capstone.be.dto.response.statistics.UserStatisticsResponse.StatusBreakdown> calculateUserStatusBreakdown(
      List<com.capstone.be.domain.entity.User> users) {
    Map<com.capstone.be.domain.enums.UserStatus, Long> statusCounts = users.stream()
        .collect(Collectors.groupingBy(com.capstone.be.domain.entity.User::getStatus, Collectors.counting()));

    return statusCounts.entrySet().stream()
        .map(entry -> com.capstone.be.dto.response.statistics.UserStatisticsResponse.StatusBreakdown.builder()
            .status(entry.getKey().name())
            .count(entry.getValue())
            .build())
        .collect(Collectors.toList());
  }

  private com.capstone.be.dto.response.statistics.UserStatisticsResponse.SummaryStatistics calculateUserSummaryStatistics(
      List<com.capstone.be.domain.entity.User> users) {
    long totalUsers = users.size();
    long activeUsers = users.stream()
        .filter(u -> u.getStatus() == com.capstone.be.domain.enums.UserStatus.ACTIVE)
        .count();
    long inactiveUsers = users.stream()
        .filter(u -> u.getStatus() == com.capstone.be.domain.enums.UserStatus.INACTIVE)
        .count();
    long pendingVerificationUsers = users.stream()
        .filter(u -> u.getStatus() == com.capstone.be.domain.enums.UserStatus.PENDING_EMAIL_VERIFY
            || u.getStatus() == com.capstone.be.domain.enums.UserStatus.PENDING_APPROVE)
        .count();

    long totalReaders = users.stream()
        .filter(u -> u.getRole() == com.capstone.be.domain.enums.UserRole.READER)
        .count();
    long totalReviewers = users.stream()
        .filter(u -> u.getRole() == com.capstone.be.domain.enums.UserRole.REVIEWER)
        .count();
    long totalOrganizationAdmins = users.stream()
        .filter(u -> u.getRole() == com.capstone.be.domain.enums.UserRole.ORGANIZATION_ADMIN)
        .count();

    // Calculate new users this month and last month
    LocalDate now = LocalDate.now();
    LocalDate thisMonthStart = now.withDayOfMonth(1);
    LocalDate lastMonthStart = thisMonthStart.minusMonths(1);
    LocalDate lastMonthEnd = thisMonthStart.minusDays(1);

    Instant thisMonthStartInstant = thisMonthStart.atStartOfDay(ZoneId.systemDefault()).toInstant();
    Instant lastMonthStartInstant = lastMonthStart.atStartOfDay(ZoneId.systemDefault()).toInstant();
    Instant lastMonthEndInstant = lastMonthEnd.atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant();

    long newUsersThisMonth = users.stream()
        .filter(u -> (u.getCreatedAt().isAfter(thisMonthStartInstant) || u.getCreatedAt().equals(thisMonthStartInstant)))
        .count();

    long newUsersLastMonth = users.stream()
        .filter(u -> (u.getCreatedAt().isAfter(lastMonthStartInstant) || u.getCreatedAt().equals(lastMonthStartInstant))
            && (u.getCreatedAt().isBefore(lastMonthEndInstant) || u.getCreatedAt().equals(lastMonthEndInstant)))
        .count();

    // Calculate growth rate
    double growthRate = 0.0;
    if (newUsersLastMonth > 0) {
      growthRate = ((double) (newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100.0;
    } else if (newUsersThisMonth > 0) {
      growthRate = 100.0; // 100% growth if last month was 0
    }

    return com.capstone.be.dto.response.statistics.UserStatisticsResponse.SummaryStatistics.builder()
        .totalUsers(totalUsers)
        .activeUsers(activeUsers)
        .inactiveUsers(inactiveUsers)
        .pendingVerificationUsers(pendingVerificationUsers)
        .totalReaders(totalReaders)
        .totalReviewers(totalReviewers)
        .totalOrganizationAdmins(totalOrganizationAdmins)
        .newUsersThisMonth(newUsersThisMonth)
        .newUsersLastMonth(newUsersLastMonth)
        .growthRate(growthRate)
        .build();
  }
}
