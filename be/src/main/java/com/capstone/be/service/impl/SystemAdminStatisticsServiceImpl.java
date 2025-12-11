package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.OrganizationProfile;
import com.capstone.be.domain.entity.SystemLog;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.domain.enums.UserStatus;
import com.capstone.be.dto.response.statistics.SystemAdminDashboardResponse;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.OrganizationProfileRepository;
import com.capstone.be.repository.SystemLogRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.service.SystemAdminStatisticsService;
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

@Slf4j
@Service
@RequiredArgsConstructor
public class SystemAdminStatisticsServiceImpl implements SystemAdminStatisticsService {

  private final UserRepository userRepository;
  private final OrganizationProfileRepository organizationProfileRepository;
  private final DocumentRepository documentRepository;
  private final SystemLogRepository systemLogRepository;

  private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");
  private static final String LOGIN_SUCCESS_ACTION = "USER_LOGIN_SUCCESS";
  private static final String LOGIN_FAILED_ACTION = "USER_LOGIN_FAILED";

  @Override
  @Transactional(readOnly = true)
  public SystemAdminDashboardResponse getDashboardStatistics(Instant startDate, Instant endDate) {
    log.info("Getting System Admin dashboard statistics from {} to {}", startDate, endDate);

    // Default to last 6 months if not provided
    if (startDate == null) {
      startDate = Instant.now().minusSeconds(180 * 24 * 60 * 60); // 6 months
    }
    if (endDate == null) {
      endDate = Instant.now();
    }

    // Calculate overview statistics
    SystemAdminDashboardResponse.OverviewStatistics overview = calculateOverviewStatistics();

    // Calculate access statistics (STA7)
    SystemAdminDashboardResponse.AccessStatistics accessStatistics = calculateAccessStatistics(startDate, endDate);

    // Calculate user activity statistics
    SystemAdminDashboardResponse.UserActivityStatistics userActivity = calculateUserActivityStatistics(startDate, endDate);

    // Calculate system activity statistics
    SystemAdminDashboardResponse.SystemActivityStatistics systemActivity = calculateSystemActivityStatistics(startDate, endDate);

    return SystemAdminDashboardResponse.builder()
        .overview(overview)
        .accessStatistics(accessStatistics)
        .userActivity(userActivity)
        .systemActivity(systemActivity)
        .build();
  }

  private SystemAdminDashboardResponse.OverviewStatistics calculateOverviewStatistics() {
    long totalUsers = userRepository.count();
    long totalOrganizations = organizationProfileRepository.count();
    long totalDocuments = documentRepository.count();

    return SystemAdminDashboardResponse.OverviewStatistics.builder()
        .totalUsers(totalUsers)
        .totalOrganizations(totalOrganizations)
        .totalDocuments(totalDocuments)
        .build();
  }

  private SystemAdminDashboardResponse.AccessStatistics calculateAccessStatistics(Instant startDate, Instant endDate) {
    // Get login success logs
    List<SystemLog> loginSuccessLogs = systemLogRepository.findAll(
        (root, query, cb) -> {
          var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
          predicates.add(cb.equal(root.get("action"), LOGIN_SUCCESS_ACTION));
          predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
          predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
          return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        });

    // Get login failed logs
    List<SystemLog> loginFailedLogs = systemLogRepository.findAll(
        (root, query, cb) -> {
          var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
          predicates.add(cb.equal(root.get("action"), LOGIN_FAILED_ACTION));
          predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
          predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
          return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        });

    // Calculate time series for login trends
    List<SystemAdminDashboardResponse.TimeSeriesData> loginSuccessTrend = calculateLoginTrendTimeSeries(loginSuccessLogs, startDate, endDate);
    List<SystemAdminDashboardResponse.TimeSeriesData> loginFailedTrend = calculateLoginTrendTimeSeries(loginFailedLogs, startDate, endDate);

    // Calculate active users trend (unique users who logged in per day)
    List<SystemAdminDashboardResponse.TimeSeriesData> activeUsersTrend = calculateActiveUsersTrend(loginSuccessLogs, startDate, endDate);

    // Calculate summary statistics
    LocalDate today = LocalDate.now();
    LocalDate weekStart = today.minusDays(6);
    LocalDate monthStart = today.minusDays(29);

    Instant todayStart = today.atStartOfDay(ZoneId.systemDefault()).toInstant();
    Instant weekStartInstant = weekStart.atStartOfDay(ZoneId.systemDefault()).toInstant();
    Instant monthStartInstant = monthStart.atStartOfDay(ZoneId.systemDefault()).toInstant();
    Instant now = Instant.now();

    long totalLoginsToday = loginSuccessLogs.stream()
        .filter(log -> log.getCreatedAt().isAfter(todayStart) || log.getCreatedAt().equals(todayStart))
        .count();
    long totalLoginsThisWeek = loginSuccessLogs.stream()
        .filter(log -> log.getCreatedAt().isAfter(weekStartInstant) || log.getCreatedAt().equals(weekStartInstant))
        .count();
    long totalLoginsThisMonth = loginSuccessLogs.stream()
        .filter(log -> log.getCreatedAt().isAfter(monthStartInstant) || log.getCreatedAt().equals(monthStartInstant))
        .count();

    long failedLoginsToday = loginFailedLogs.stream()
        .filter(log -> log.getCreatedAt().isAfter(todayStart) || log.getCreatedAt().equals(todayStart))
        .count();
    long failedLoginsThisWeek = loginFailedLogs.stream()
        .filter(log -> log.getCreatedAt().isAfter(weekStartInstant) || log.getCreatedAt().equals(weekStartInstant))
        .count();
    long failedLoginsThisMonth = loginFailedLogs.stream()
        .filter(log -> log.getCreatedAt().isAfter(monthStartInstant) || log.getCreatedAt().equals(monthStartInstant))
        .count();

    // Calculate active users (users who logged in within last 7/30 days)
    Instant last7Days = Instant.now().minusSeconds(7 * 24 * 60 * 60);
    Instant last30Days = Instant.now().minusSeconds(30 * 24 * 60 * 60);

    long activeUsersLast7Days = loginSuccessLogs.stream()
        .filter(log -> log.getCreatedAt().isAfter(last7Days))
        .map(SystemLog::getUserId)
        .filter(userId -> userId != null)
        .distinct()
        .count();

    long activeUsersLast30Days = loginSuccessLogs.stream()
        .filter(log -> log.getCreatedAt().isAfter(last30Days))
        .map(SystemLog::getUserId)
        .filter(userId -> userId != null)
        .distinct()
        .count();

    return SystemAdminDashboardResponse.AccessStatistics.builder()
        .loginSuccessTrend(loginSuccessTrend)
        .loginFailedTrend(loginFailedTrend)
        .activeUsersTrend(activeUsersTrend)
        .totalLoginsToday(totalLoginsToday)
        .totalLoginsThisWeek(totalLoginsThisWeek)
        .totalLoginsThisMonth(totalLoginsThisMonth)
        .failedLoginsToday(failedLoginsToday)
        .failedLoginsThisWeek(failedLoginsThisWeek)
        .failedLoginsThisMonth(failedLoginsThisMonth)
        .activeUsersLast7Days(activeUsersLast7Days)
        .activeUsersLast30Days(activeUsersLast30Days)
        .build();
  }

  private SystemAdminDashboardResponse.UserActivityStatistics calculateUserActivityStatistics(Instant startDate, Instant endDate) {
    // Get all users with date filter
    Specification<User> userSpec = (root, query, cb) -> {
      var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
      if (startDate != null) {
        predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
      }
      if (endDate != null) {
        predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
      }
      return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
    };

    List<User> allUsers = userRepository.findAll(userSpec);

    // Calculate user growth by role
    List<SystemAdminDashboardResponse.RoleGrowthData> userGrowthByRole = calculateUserGrowthByRole(allUsers, startDate, endDate);

    // Calculate user status breakdown
    List<SystemAdminDashboardResponse.StatusBreakdown> userStatusBreakdown = calculateUserStatusBreakdown(allUsers);

    // Calculate new users registration over time
    List<SystemAdminDashboardResponse.TimeSeriesData> newUsersRegistration = calculateNewUsersRegistrationTimeSeries(allUsers, startDate, endDate);

    // Calculate summary
    long totalReaders = userRepository.count(
        (root, query, cb) -> cb.equal(root.get("role"), UserRole.READER));
    long totalReviewers = userRepository.count(
        (root, query, cb) -> cb.equal(root.get("role"), UserRole.REVIEWER));
    long totalOrganizationAdmins = userRepository.count(
        (root, query, cb) -> cb.equal(root.get("role"), UserRole.ORGANIZATION_ADMIN));
    long totalBusinessAdmins = userRepository.count(
        (root, query, cb) -> cb.equal(root.get("role"), UserRole.BUSINESS_ADMIN));

    LocalDate today = LocalDate.now();
    LocalDate weekStart = today.minusDays(6);
    LocalDate monthStart = today.minusDays(29);

    Instant todayStart = today.atStartOfDay(ZoneId.systemDefault()).toInstant();
    Instant weekStartInstant = weekStart.atStartOfDay(ZoneId.systemDefault()).toInstant();
    Instant monthStartInstant = monthStart.atStartOfDay(ZoneId.systemDefault()).toInstant();

    long newUsersToday = allUsers.stream()
        .filter(u -> u.getCreatedAt().isAfter(todayStart) || u.getCreatedAt().equals(todayStart))
        .count();
    long newUsersThisWeek = allUsers.stream()
        .filter(u -> u.getCreatedAt().isAfter(weekStartInstant) || u.getCreatedAt().equals(weekStartInstant))
        .count();
    long newUsersThisMonth = allUsers.stream()
        .filter(u -> u.getCreatedAt().isAfter(monthStartInstant) || u.getCreatedAt().equals(monthStartInstant))
        .count();

    return SystemAdminDashboardResponse.UserActivityStatistics.builder()
        .userGrowthByRole(userGrowthByRole)
        .userStatusBreakdown(userStatusBreakdown)
        .newUsersRegistration(newUsersRegistration)
        .totalReaders(totalReaders)
        .totalReviewers(totalReviewers)
        .totalOrganizationAdmins(totalOrganizationAdmins)
        .totalBusinessAdmins(totalBusinessAdmins)
        .newUsersToday(newUsersToday)
        .newUsersThisWeek(newUsersThisWeek)
        .newUsersThisMonth(newUsersThisMonth)
        .build();
  }

  private SystemAdminDashboardResponse.SystemActivityStatistics calculateSystemActivityStatistics(Instant startDate, Instant endDate) {
    // Get documents uploaded over time
    Specification<Document> docSpec = (root, query, cb) -> {
      var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
      if (startDate != null) {
        predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
      }
      if (endDate != null) {
        predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
      }
      return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
    };

    List<Document> documents = documentRepository.findAll(docSpec);
    List<SystemAdminDashboardResponse.TimeSeriesData> documentsUploaded = calculateDocumentsUploadedTimeSeries(documents, startDate, endDate);

    // Get organizations created over time
    Specification<OrganizationProfile> orgSpec = (root, query, cb) -> {
      var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
      if (startDate != null) {
        predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
      }
      if (endDate != null) {
        predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
      }
      return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
    };

    List<OrganizationProfile> organizations = organizationProfileRepository.findAll(orgSpec);
    List<SystemAdminDashboardResponse.TimeSeriesData> organizationsCreated = calculateOrganizationsCreatedTimeSeries(organizations, startDate, endDate);

    // Get system actions from logs
    List<SystemLog> systemLogs = systemLogRepository.findAll(
        (root, query, cb) -> {
          var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
          // Exclude login actions (already in access statistics)
          predicates.add(cb.notEqual(root.get("action"), LOGIN_SUCCESS_ACTION));
          predicates.add(cb.notEqual(root.get("action"), LOGIN_FAILED_ACTION));
          if (startDate != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
          }
          if (endDate != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
          }
          return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        });

    List<SystemAdminDashboardResponse.ActionBreakdown> systemActionsBreakdown = calculateSystemActionsBreakdown(systemLogs);
    List<SystemAdminDashboardResponse.TimeSeriesData> systemActionsTrend = calculateSystemActionsTrendTimeSeries(systemLogs, startDate, endDate);

    return SystemAdminDashboardResponse.SystemActivityStatistics.builder()
        .documentsUploaded(documentsUploaded)
        .organizationsCreated(organizationsCreated)
        .systemActionsBreakdown(systemActionsBreakdown)
        .systemActionsTrend(systemActionsTrend)
        .build();
  }

  // Helper methods

  private List<SystemAdminDashboardResponse.TimeSeriesData> calculateLoginTrendTimeSeries(
      List<SystemLog> logs, Instant startDate, Instant endDate) {
    Map<String, Long> dateCounts = new HashMap<>();

    for (SystemLog log : logs) {
      LocalDate date = log.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate();
      String dateStr = date.format(DATE_FORMATTER);
      dateCounts.put(dateStr, dateCounts.getOrDefault(dateStr, 0L) + 1);
    }

    return buildTimeSeries(dateCounts, startDate, endDate);
  }

  private List<SystemAdminDashboardResponse.TimeSeriesData> calculateActiveUsersTrend(
      List<SystemLog> loginLogs, Instant startDate, Instant endDate) {
    // Group by date and count unique users per day
    Map<String, java.util.Set<UUID>> dateUserMap = new HashMap<>();

    for (SystemLog log : loginLogs) {
      if (log.getUserId() != null) {
        LocalDate date = log.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate();
        String dateStr = date.format(DATE_FORMATTER);
        dateUserMap.computeIfAbsent(dateStr, k -> new java.util.HashSet<>()).add(log.getUserId());
      }
    }

    Map<String, Long> dateCounts = new HashMap<>();
    dateUserMap.forEach((date, userIds) -> dateCounts.put(date, (long) userIds.size()));

    return buildTimeSeries(dateCounts, startDate, endDate);
  }

  private List<SystemAdminDashboardResponse.RoleGrowthData> calculateUserGrowthByRole(
      List<User> users, Instant startDate, Instant endDate) {
    Map<UserRole, List<User>> usersByRole = users.stream()
        .collect(Collectors.groupingBy(User::getRole));

    List<SystemAdminDashboardResponse.RoleGrowthData> roleGrowthList = new ArrayList<>();

    for (Map.Entry<UserRole, List<User>> entry : usersByRole.entrySet()) {
      UserRole role = entry.getKey();
      List<User> roleUsers = entry.getValue();

      Map<String, Long> dateCounts = new HashMap<>();
      for (User user : roleUsers) {
        LocalDate date = user.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate();
        String dateStr = date.format(DATE_FORMATTER);
        dateCounts.put(dateStr, dateCounts.getOrDefault(dateStr, 0L) + 1);
      }

      List<SystemAdminDashboardResponse.TimeSeriesData> growth = buildTimeSeries(dateCounts, startDate, endDate);

      roleGrowthList.add(SystemAdminDashboardResponse.RoleGrowthData.builder()
          .role(role.name())
          .growth(growth)
          .build());
    }

    return roleGrowthList;
  }

  private List<SystemAdminDashboardResponse.StatusBreakdown> calculateUserStatusBreakdown(List<User> users) {
    Map<UserStatus, Long> statusCounts = users.stream()
        .collect(Collectors.groupingBy(User::getStatus, Collectors.counting()));

    return statusCounts.entrySet().stream()
        .map(entry -> SystemAdminDashboardResponse.StatusBreakdown.builder()
            .status(entry.getKey().name())
            .count(entry.getValue())
            .build())
        .collect(Collectors.toList());
  }

  private List<SystemAdminDashboardResponse.TimeSeriesData> calculateNewUsersRegistrationTimeSeries(
      List<User> users, Instant startDate, Instant endDate) {
    Map<String, Long> dateCounts = new HashMap<>();

    for (User user : users) {
      LocalDate date = user.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate();
      String dateStr = date.format(DATE_FORMATTER);
      dateCounts.put(dateStr, dateCounts.getOrDefault(dateStr, 0L) + 1);
    }

    return buildTimeSeries(dateCounts, startDate, endDate);
  }

  private List<SystemAdminDashboardResponse.TimeSeriesData> calculateDocumentsUploadedTimeSeries(
      List<Document> documents, Instant startDate, Instant endDate) {
    Map<String, Long> dateCounts = new HashMap<>();

    for (Document doc : documents) {
      LocalDate date = doc.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate();
      String dateStr = date.format(DATE_FORMATTER);
      dateCounts.put(dateStr, dateCounts.getOrDefault(dateStr, 0L) + 1);
    }

    return buildTimeSeries(dateCounts, startDate, endDate);
  }

  private List<SystemAdminDashboardResponse.TimeSeriesData> calculateOrganizationsCreatedTimeSeries(
      List<OrganizationProfile> organizations, Instant startDate, Instant endDate) {
    Map<String, Long> dateCounts = new HashMap<>();

    for (OrganizationProfile org : organizations) {
      LocalDate date = org.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate();
      String dateStr = date.format(DATE_FORMATTER);
      dateCounts.put(dateStr, dateCounts.getOrDefault(dateStr, 0L) + 1);
    }

    return buildTimeSeries(dateCounts, startDate, endDate);
  }

  private List<SystemAdminDashboardResponse.ActionBreakdown> calculateSystemActionsBreakdown(List<SystemLog> logs) {
    Map<String, Long> actionCounts = logs.stream()
        .collect(Collectors.groupingBy(SystemLog::getAction, Collectors.counting()));

    return actionCounts.entrySet().stream()
        .sorted((e1, e2) -> Long.compare(e2.getValue(), e1.getValue())) // Sort by count descending
        .limit(10) // Top 10 actions
        .map(entry -> SystemAdminDashboardResponse.ActionBreakdown.builder()
            .action(entry.getKey())
            .count(entry.getValue())
            .build())
        .collect(Collectors.toList());
  }

  private List<SystemAdminDashboardResponse.TimeSeriesData> calculateSystemActionsTrendTimeSeries(
      List<SystemLog> logs, Instant startDate, Instant endDate) {
    Map<String, Long> dateCounts = new HashMap<>();

    for (SystemLog log : logs) {
      LocalDate date = log.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate();
      String dateStr = date.format(DATE_FORMATTER);
      dateCounts.put(dateStr, dateCounts.getOrDefault(dateStr, 0L) + 1);
    }

    return buildTimeSeries(dateCounts, startDate, endDate);
  }

  private List<SystemAdminDashboardResponse.TimeSeriesData> buildTimeSeries(
      Map<String, Long> dateCounts, Instant startDate, Instant endDate) {
    LocalDate start = startDate != null
        ? startDate.atZone(ZoneId.systemDefault()).toLocalDate()
        : LocalDate.now().minusMonths(6);
    LocalDate end = endDate != null
        ? endDate.atZone(ZoneId.systemDefault()).toLocalDate()
        : LocalDate.now();

    List<SystemAdminDashboardResponse.TimeSeriesData> series = new ArrayList<>();
    LocalDate current = start;
    while (!current.isAfter(end)) {
      String dateStr = current.format(DATE_FORMATTER);
      series.add(SystemAdminDashboardResponse.TimeSeriesData.builder()
          .date(dateStr)
          .count(dateCounts.getOrDefault(dateStr, 0L))
          .build());
      current = current.plusDays(1);
    }

    return series;
  }
}


