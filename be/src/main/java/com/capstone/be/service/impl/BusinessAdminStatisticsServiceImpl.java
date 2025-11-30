package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.Comment;
import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.DocumentReadHistory;
import com.capstone.be.domain.entity.DocumentRedemption;
import com.capstone.be.domain.entity.DocumentReport;
import com.capstone.be.domain.entity.DocumentVote;
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

@Slf4j
@Service
@RequiredArgsConstructor
public class BusinessAdminStatisticsServiceImpl implements BusinessAdminStatisticsService {

  private final DocumentRepository documentRepository;
  private final DocumentReadHistoryRepository documentReadHistoryRepository;
  private final DocumentVoteRepository documentVoteRepository;
  private final CommentRepository commentRepository;
  private final SavedListDocumentRepository savedListDocumentRepository;
  private final DocumentRedemptionRepository documentRedemptionRepository;
  private final DocumentReportRepository documentReportRepository;
  private final UserRepository userRepository;
  private final OrganizationProfileRepository organizationProfileRepository;
  private final DocTypeRepository docTypeRepository;
  private final OrganizationStatisticsService organizationStatisticsService;

  private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

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

  @Override
  @Transactional(readOnly = true)
  public GlobalDocumentStatisticsResponse getGlobalDocumentStatistics(
      Instant startDate, Instant endDate) {
    log.info("Getting global document statistics from {} to {}", startDate, endDate);

    // Get all documents with date filter
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

    List<Document> allDocuments = documentRepository.findAll(docSpec);
    List<UUID> documentIds = allDocuments.stream()
        .map(Document::getId)
        .collect(Collectors.toList());

    // Calculate summary statistics
    GlobalDocumentStatisticsResponse.SummaryStatistics summary = calculateGlobalDocumentSummary(allDocuments, documentIds, startDate,
        endDate);

    // Calculate time series data
    List<GlobalDocumentStatisticsResponse.TimeSeriesData> documentUploads = calculateDocumentUploadsTimeSeries(allDocuments,
        startDate, endDate);
    List<GlobalDocumentStatisticsResponse.TimeSeriesData> documentViews = calculateDocumentViewsTimeSeries(documentIds, startDate,
        endDate);
    List<GlobalDocumentStatisticsResponse.TimeSeriesData> votesReceived = calculateVotesTimeSeries(documentIds, startDate, endDate);
    List<GlobalDocumentStatisticsResponse.TimeSeriesData> commentsReceived = calculateCommentsTimeSeries(documentIds, startDate,
        endDate);
    List<GlobalDocumentStatisticsResponse.TimeSeriesData> documentsSaved = calculateDocumentsSavedTimeSeries(documentIds, startDate,
        endDate);
    List<GlobalDocumentStatisticsResponse.TimeSeriesData> documentsPurchased = calculateDocumentsPurchasedTimeSeries(documentIds,
        startDate, endDate);

    // Calculate breakdowns
    List<GlobalDocumentStatisticsResponse.StatusBreakdown> statusBreakdown = calculateStatusBreakdown(allDocuments);
    List<GlobalDocumentStatisticsResponse.VisibilityBreakdown> visibilityBreakdown = calculateVisibilityBreakdown(allDocuments);
    GlobalDocumentStatisticsResponse.PremiumBreakdown premiumBreakdown = calculatePremiumBreakdown(allDocuments);
    List<OrganizationBreakdown> organizationBreakdown = calculateOrganizationBreakdown(
        allDocuments);
    List<TypeBreakdown> typeBreakdown = calculateTypeBreakdown(allDocuments);

    return GlobalDocumentStatisticsResponse.builder()
        .summary(summary)
        .documentUploads(documentUploads)
        .documentViews(documentViews)
        .votesReceived(votesReceived)
        .commentsReceived(commentsReceived)
        .documentsSaved(documentsSaved)
        .documentsPurchased(documentsPurchased)
        .statusBreakdown(statusBreakdown)
        .visibilityBreakdown(visibilityBreakdown)
        .premiumBreakdown(premiumBreakdown)
        .organizationBreakdown(organizationBreakdown)
        .typeBreakdown(typeBreakdown)
        .build();
  }

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

  @Override
  @Transactional(readOnly = true)
  public com.capstone.be.dto.response.statistics.OrganizationStatisticsResponse getOrganizationStatistics(
      UUID organizationId, Instant startDate, Instant endDate) {
    // Delegate to OrganizationStatisticsService
    return organizationStatisticsService.getOrganizationStatistics(organizationId, startDate,
        endDate);
  }

  // Helper methods for Global Document Statistics

  private GlobalDocumentStatisticsResponse.SummaryStatistics calculateGlobalDocumentSummary(List<Document> documents,
      List<UUID> documentIds, Instant startDate, Instant endDate) {
    long totalDocuments = documents.size();
    long totalViews = documents.stream()
        .mapToLong(doc -> doc.getViewCount() != null ? doc.getViewCount() : 0L)
        .sum();
    long totalUpvotes = documents.stream()
        .mapToLong(doc -> doc.getUpvoteCount() != null ? doc.getUpvoteCount() : 0L)
        .sum();
    long totalVoteScore = documents.stream()
        .mapToLong(doc -> doc.getVoteScore() != null ? doc.getVoteScore() : 0L)
        .sum();
    long totalDownvotes = (totalUpvotes - totalVoteScore) / 2;

    // Count comments
    long totalComments = commentRepository.count(
        (root, query, cb) -> {
          var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
          predicates.add(root.get("document").get("id").in(documentIds));
          predicates.add(cb.equal(root.get("isDeleted"), false));
          if (startDate != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
          }
          if (endDate != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
          }
          return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        });

    // Count saves
    long totalSaves = savedListDocumentRepository.count(
        (root, query, cb) -> {
          var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
          predicates.add(root.get("document").get("id").in(documentIds));
          if (startDate != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
          }
          if (endDate != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
          }
          return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        });

    // Count purchases
    long totalPurchases = documentRedemptionRepository.count(
        (root, query, cb) -> {
          var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
          predicates.add(root.get("document").get("id").in(documentIds));
          if (startDate != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
          }
          if (endDate != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
          }
          return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        });

    // Count organizations
    long totalOrganizations = documents.stream()
        .filter(doc -> doc.getOrganization() != null)
        .map(doc -> doc.getOrganization().getId())
        .distinct()
        .count();

    // Count uploaders
    long totalUploaders = documents.stream()
        .map(Document::getUploader)
        .map(uploader -> uploader.getId())
        .distinct()
        .count();

    double avgViews = totalDocuments > 0 ? (double) totalViews / totalDocuments : 0.0;
    double avgVotes = totalDocuments > 0 ? (double) (totalUpvotes + totalDownvotes) / totalDocuments
        : 0.0;

    return GlobalDocumentStatisticsResponse.SummaryStatistics.builder()
        .totalDocuments(totalDocuments)
        .totalViews(totalViews)
        .totalUpvotes(totalUpvotes)
        .totalDownvotes(totalDownvotes)
        .totalComments(totalComments)
        .totalSaves(totalSaves)
        .totalPurchases(totalPurchases)
        .totalOrganizations(totalOrganizations)
        .totalUploaders(totalUploaders)
        .averageViewsPerDocument(avgViews)
        .averageVotesPerDocument(avgVotes)
        .build();
  }

  private List<GlobalDocumentStatisticsResponse.TimeSeriesData> calculateDocumentUploadsTimeSeries(List<Document> documents,
      Instant startDate, Instant endDate) {
    Map<String, Long> dateCounts = new HashMap<>();

    for (Document doc : documents) {
      LocalDate date = doc.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate();
      String dateStr = date.format(DATE_FORMATTER);
      dateCounts.put(dateStr, dateCounts.getOrDefault(dateStr, 0L) + 1);
    }

    return buildGlobalDocumentTimeSeries(dateCounts, startDate, endDate);
  }

  private List<GlobalDocumentStatisticsResponse.TimeSeriesData> calculateDocumentViewsTimeSeries(List<UUID> documentIds,
      Instant startDate, Instant endDate) {
    List<DocumentReadHistory> histories = documentReadHistoryRepository.findAll(
        (root, query, cb) -> {
          var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
          predicates.add(root.get("document").get("id").in(documentIds));
          if (startDate != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
          }
          if (endDate != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
          }
          return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        });

    Map<String, Long> dateCounts = new HashMap<>();
    for (DocumentReadHistory history : histories) {
      LocalDate date = history.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate();
      String dateStr = date.format(DATE_FORMATTER);
      dateCounts.put(dateStr, dateCounts.getOrDefault(dateStr, 0L) + 1);
    }

    return buildGlobalDocumentTimeSeries(dateCounts, startDate, endDate);
  }

  private List<GlobalDocumentStatisticsResponse.TimeSeriesData> calculateVotesTimeSeries(List<UUID> documentIds, Instant startDate,
      Instant endDate) {
    List<DocumentVote> votes = documentVoteRepository.findAll(
        (root, query, cb) -> {
          var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
          predicates.add(root.get("document").get("id").in(documentIds));
          if (startDate != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
          }
          if (endDate != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
          }
          return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        });

    Map<String, Long> dateCounts = new HashMap<>();
    for (DocumentVote vote : votes) {
      LocalDate date = vote.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate();
      String dateStr = date.format(DATE_FORMATTER);
      dateCounts.put(dateStr, dateCounts.getOrDefault(dateStr, 0L) + 1);
    }

    return buildGlobalDocumentTimeSeries(dateCounts, startDate, endDate);
  }

  private List<GlobalDocumentStatisticsResponse.TimeSeriesData> calculateCommentsTimeSeries(List<UUID> documentIds,
      Instant startDate, Instant endDate) {
    List<Comment> comments = commentRepository.findAll(
        (root, query, cb) -> {
          var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
          predicates.add(root.get("document").get("id").in(documentIds));
          predicates.add(cb.equal(root.get("isDeleted"), false));
          if (startDate != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
          }
          if (endDate != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
          }
          return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        });

    Map<String, Long> dateCounts = new HashMap<>();
    for (Comment comment : comments) {
      LocalDate date = comment.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate();
      String dateStr = date.format(DATE_FORMATTER);
      dateCounts.put(dateStr, dateCounts.getOrDefault(dateStr, 0L) + 1);
    }

    return buildGlobalDocumentTimeSeries(dateCounts, startDate, endDate);
  }

  private List<GlobalDocumentStatisticsResponse.TimeSeriesData> calculateDocumentsSavedTimeSeries(List<UUID> documentIds,
      Instant startDate, Instant endDate) {
    List<SavedListDocument> savedDocs = savedListDocumentRepository.findAll(
        (root, query, cb) -> {
          var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
          predicates.add(root.get("document").get("id").in(documentIds));
          if (startDate != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
          }
          if (endDate != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
          }
          return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        });

    Map<String, Long> dateCounts = new HashMap<>();
    for (SavedListDocument savedDoc : savedDocs) {
      LocalDate date = savedDoc.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate();
      String dateStr = date.format(DATE_FORMATTER);
      dateCounts.put(dateStr, dateCounts.getOrDefault(dateStr, 0L) + 1);
    }

    return buildGlobalDocumentTimeSeries(dateCounts, startDate, endDate);
  }

  private List<GlobalDocumentStatisticsResponse.TimeSeriesData> calculateDocumentsPurchasedTimeSeries(List<UUID> documentIds,
      Instant startDate, Instant endDate) {
    List<DocumentRedemption> redemptions = documentRedemptionRepository.findAll(
        (root, query, cb) -> {
          var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
          predicates.add(root.get("document").get("id").in(documentIds));
          if (startDate != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
          }
          if (endDate != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
          }
          return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        });

    Map<String, Long> dateCounts = new HashMap<>();
    for (DocumentRedemption redemption : redemptions) {
      LocalDate date = redemption.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate();
      String dateStr = date.format(DATE_FORMATTER);
      dateCounts.put(dateStr, dateCounts.getOrDefault(dateStr, 0L) + 1);
    }

    return buildGlobalDocumentTimeSeries(dateCounts, startDate, endDate);
  }

  private List<GlobalDocumentStatisticsResponse.StatusBreakdown> calculateStatusBreakdown(List<Document> documents) {
    Map<DocStatus, Long> statusCounts = documents.stream()
        .collect(Collectors.groupingBy(Document::getStatus, Collectors.counting()));

    return statusCounts.entrySet().stream()
        .map(entry -> GlobalDocumentStatisticsResponse.StatusBreakdown.builder()
            .status(entry.getKey().name())
            .count(entry.getValue())
            .build())
        .collect(Collectors.toList());
  }

  private List<GlobalDocumentStatisticsResponse.VisibilityBreakdown> calculateVisibilityBreakdown(List<Document> documents) {
    Map<DocVisibility, Long> visibilityCounts = documents.stream()
        .collect(Collectors.groupingBy(Document::getVisibility, Collectors.counting()));

    return visibilityCounts.entrySet().stream()
        .map(entry -> GlobalDocumentStatisticsResponse.VisibilityBreakdown.builder()
            .visibility(entry.getKey().name())
            .count(entry.getValue())
            .build())
        .collect(Collectors.toList());
  }

  private GlobalDocumentStatisticsResponse.PremiumBreakdown calculatePremiumBreakdown(List<Document> documents) {
    long premiumCount = documents.stream()
        .filter(doc -> Boolean.TRUE.equals(doc.getIsPremium()))
        .count();
    long freeCount = documents.size() - premiumCount;

    return GlobalDocumentStatisticsResponse.PremiumBreakdown.builder()
        .premiumCount(premiumCount)
        .freeCount(freeCount)
        .build();
  }

  private List<OrganizationBreakdown> calculateOrganizationBreakdown(List<Document> documents) {
    Map<UUID, Long> orgCounts = documents.stream()
        .filter(doc -> doc.getOrganization() != null)
        .collect(Collectors.groupingBy(
            doc -> doc.getOrganization().getId(),
            Collectors.counting()));

    return orgCounts.entrySet().stream()
        .sorted((e1, e2) -> Long.compare(e2.getValue(), e1.getValue()))
        .limit(10) // Top 10 organizations
        .map(entry -> {
          UUID orgId = entry.getKey();
          long count = entry.getValue();

          String orgName = documents.stream()
              .filter(doc -> doc.getOrganization() != null
                  && doc.getOrganization().getId().equals(orgId))
              .findFirst()
              .map(doc -> doc.getOrganization().getName())
              .orElse("Unknown");

          return OrganizationBreakdown.builder()
              .organizationId(orgId.toString())
              .organizationName(orgName)
              .documentCount(count)
              .build();
        })
        .collect(Collectors.toList());
  }

  private List<TypeBreakdown> calculateTypeBreakdown(List<Document> documents) {
    Map<UUID, Long> typeCounts = documents.stream()
        .collect(Collectors.groupingBy(
            doc -> doc.getDocType().getId(),
            Collectors.counting()));

    return typeCounts.entrySet().stream()
        .sorted((e1, e2) -> Long.compare(e2.getValue(), e1.getValue()))
        .limit(10) // Top 10 document types
        .map(entry -> {
          UUID typeId = entry.getKey();
          long count = entry.getValue();

          String typeName = documents.stream()
              .filter(doc -> doc.getDocType().getId().equals(typeId))
              .findFirst()
              .map(doc -> doc.getDocType().getName())
              .orElse("Unknown");

          return TypeBreakdown.builder()
              .typeId(typeId.toString())
              .typeName(typeName)
              .count(count)
              .build();
        })
        .collect(Collectors.toList());
  }

  // Helper methods for Report Handling Statistics

  private ReportHandlingStatisticsResponse.SummaryStatistics calculateReportSummary(
      List<DocumentReport> reports) {
    long totalReports = reports.size();
    long pendingReports = reports.stream()
        .filter(r -> r.getStatus() == ReportStatus.PENDING)
        .count();
    long inReviewReports = reports.stream()
        .filter(r -> r.getStatus() == ReportStatus.IN_REVIEW)
        .count();
    long resolvedReports = reports.stream()
        .filter(r -> r.getStatus() == ReportStatus.RESOLVED)
        .count();
    long rejectedReports = reports.stream()
        .filter(r -> r.getStatus() == ReportStatus.REJECTED)
        .count();
    long closedReports = reports.stream()
        .filter(r -> r.getStatus() == ReportStatus.CLOSED)
        .count();

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

  private List<ReportHandlingStatisticsResponse.TimeSeriesData> calculateReportsRejectedTimeSeries(List<DocumentReport> reports,
      Instant startDate, Instant endDate) {
    Map<String, Long> dateCounts = new HashMap<>();

    for (DocumentReport report : reports) {
      if (report.getStatus() == ReportStatus.REJECTED && report.getUpdatedAt() != null) {
        LocalDate date = report.getUpdatedAt().atZone(ZoneId.systemDefault()).toLocalDate();
        String dateStr = date.format(DATE_FORMATTER);
        dateCounts.put(dateStr, dateCounts.getOrDefault(dateStr, 0L) + 1);
      }
    }

    return buildReportTimeSeries(dateCounts, startDate, endDate);
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

  private List<ResolutionTimeBreakdown> calculateResolutionTimeBreakdown(
      List<DocumentReport> reports) {
    List<DocumentReport> resolved = reports.stream()
        .filter(r -> (r.getStatus() == ReportStatus.RESOLVED
            || r.getStatus() == ReportStatus.REJECTED
            || r.getStatus() == ReportStatus.CLOSED)
            && r.getUpdatedAt() != null)
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

  // Common helper methods for Global Document Statistics
  private List<GlobalDocumentStatisticsResponse.TimeSeriesData> buildGlobalDocumentTimeSeries(Map<String, Long> dateCounts, Instant startDate,
      Instant endDate) {
    LocalDate start = startDate != null
        ? startDate.atZone(ZoneId.systemDefault()).toLocalDate()
        : LocalDate.now().minusMonths(6);
    LocalDate end = endDate != null
        ? endDate.atZone(ZoneId.systemDefault()).toLocalDate()
        : LocalDate.now();

    List<GlobalDocumentStatisticsResponse.TimeSeriesData> series = new ArrayList<>();
    LocalDate current = start;
    while (!current.isAfter(end)) {
      String dateStr = current.format(DATE_FORMATTER);
      series.add(GlobalDocumentStatisticsResponse.TimeSeriesData.builder()
          .date(dateStr)
          .count(dateCounts.getOrDefault(dateStr, 0L))
          .build());
      current = current.plusDays(1);
    }

    return series;
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
}

