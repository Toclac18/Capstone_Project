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
import com.capstone.be.service.BaOrganizationStatisticsService;

/**
 * Thân các phương thức chuyển NGUYÊN VĂN từ BusinessAdminStatisticsServiceImpl.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class BaOrganizationStatisticsServiceImpl implements BaOrganizationStatisticsService {

  /** Dùng chung cho mọi chuỗi thống kê theo ngày. */
  private static final DateTimeFormatter DATE_FORMATTER =
      DateTimeFormatter.ofPattern("yyyy-MM-dd");

  private final DocumentRepository documentRepository;
  private final DocumentReadHistoryRepository documentReadHistoryRepository;
  private final CommentRepository commentRepository;
  private final OrganizationProfileRepository organizationProfileRepository;
  private final OrgEnrollmentRepository orgEnrollmentRepository;


  @Override
  @Transactional(readOnly = true)
  public com.capstone.be.dto.response.statistics.GlobalOrganizationStatisticsResponse getGlobalOrganizationStatistics(
      Instant startDate, Instant endDate) {
    log.info("Getting global organization statistics from {} to {}", startDate, endDate);

    // Get all organizations with date filter
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

    List<OrganizationProfile> allOrganizations = organizationProfileRepository.findAll(orgSpec);
    List<UUID> organizationIds = allOrganizations.stream()
        .map(OrganizationProfile::getId)
        .collect(Collectors.toList());

    // Get all documents from organizations
    Specification<Document> docSpec = (root, query, cb) -> {
      var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
      predicates.add(cb.isNotNull(root.get("organization")));
      if (startDate != null) {
        predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
      }
      if (endDate != null) {
        predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
      }
      return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
    };

    List<Document> orgDocuments = documentRepository.findAll(docSpec);
    List<UUID> documentIds = orgDocuments.stream()
        .map(Document::getId)
        .collect(Collectors.toList());

    // Get all enrollments for organizations
    List<OrgEnrollment> allEnrollments = orgEnrollmentRepository.findAll(
        (root, query, cb) -> {
          var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
          predicates.add(root.get("organization").get("id").in(organizationIds));
          if (startDate != null) {
            predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
          }
          if (endDate != null) {
            predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
          }
          return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
        });

    // Calculate summary statistics
    com.capstone.be.dto.response.statistics.GlobalOrganizationStatisticsResponse.SummaryStatistics summary = 
        calculateGlobalOrganizationSummary(allOrganizations, orgDocuments, documentIds, allEnrollments, startDate, endDate);

    // Calculate time series data
    List<com.capstone.be.dto.response.statistics.GlobalOrganizationStatisticsResponse.TimeSeriesData> organizationGrowth = 
        calculateOrganizationGrowthTimeSeries(allOrganizations, startDate, endDate);
    List<com.capstone.be.dto.response.statistics.GlobalOrganizationStatisticsResponse.TimeSeriesData> memberGrowth = 
        calculateGlobalMemberGrowthTimeSeries(allEnrollments, startDate, endDate);
    List<com.capstone.be.dto.response.statistics.GlobalOrganizationStatisticsResponse.TimeSeriesData> documentUploads = 
        calculateOrganizationDocumentUploadsTimeSeries(orgDocuments, startDate, endDate);
    List<com.capstone.be.dto.response.statistics.GlobalOrganizationStatisticsResponse.TimeSeriesData> documentViews = 
        calculateOrganizationDocumentViewsTimeSeries(documentIds, startDate, endDate);

    // Calculate breakdowns
    List<com.capstone.be.dto.response.statistics.GlobalOrganizationStatisticsResponse.OrganizationBreakdown> topOrganizations = 
        calculateTopOrganizationsBreakdown(allOrganizations, orgDocuments, allEnrollments);
    List<com.capstone.be.dto.response.statistics.GlobalOrganizationStatisticsResponse.TypeBreakdown> organizationTypeBreakdown = 
        calculateOrganizationTypeBreakdown(allOrganizations);
    List<com.capstone.be.dto.response.statistics.GlobalOrganizationStatisticsResponse.MemberCountBreakdown> memberCountBreakdown = 
        calculateMemberCountBreakdown(allOrganizations, allEnrollments);

    return com.capstone.be.dto.response.statistics.GlobalOrganizationStatisticsResponse.builder()
        .summary(summary)
        .organizationGrowth(organizationGrowth)
        .memberGrowth(memberGrowth)
        .documentUploads(documentUploads)
        .documentViews(documentViews)
        .topOrganizations(topOrganizations)
        .organizationTypeBreakdown(organizationTypeBreakdown)
        .memberCountBreakdown(memberCountBreakdown)
        .build();
  }

  private List<com.capstone.be.dto.response.statistics.GlobalOrganizationStatisticsResponse.TimeSeriesData> buildGlobalOrganizationTimeSeries(
      Map<String, Long> dateCounts, Instant startDate, Instant endDate) {
    LocalDate start = startDate != null
        ? startDate.atZone(ZoneId.systemDefault()).toLocalDate()
        : LocalDate.now().minusMonths(6);
    LocalDate end = endDate != null
        ? endDate.atZone(ZoneId.systemDefault()).toLocalDate()
        : LocalDate.now();

    List<com.capstone.be.dto.response.statistics.GlobalOrganizationStatisticsResponse.TimeSeriesData> series = new ArrayList<>();
    LocalDate current = start;
    while (!current.isAfter(end)) {
      String dateStr = current.format(DATE_FORMATTER);
      series.add(com.capstone.be.dto.response.statistics.GlobalOrganizationStatisticsResponse.TimeSeriesData.builder()
          .date(dateStr)
          .count(dateCounts.getOrDefault(dateStr, 0L))
          .build());
      current = current.plusDays(1);
    }

    return series;
  }

  private List<com.capstone.be.dto.response.statistics.GlobalOrganizationStatisticsResponse.TimeSeriesData> calculateGlobalMemberGrowthTimeSeries(
      List<OrgEnrollment> enrollments, Instant startDate, Instant endDate) {
    Map<String, Long> dateCounts = new HashMap<>();

    for (OrgEnrollment enrollment : enrollments) {
      if (enrollment.getStatus() == com.capstone.be.domain.enums.OrgEnrollStatus.JOINED) {
        LocalDate date = enrollment.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate();
        String dateStr = date.format(DATE_FORMATTER);
        dateCounts.put(dateStr, dateCounts.getOrDefault(dateStr, 0L) + 1);
      }
    }

    return buildGlobalOrganizationTimeSeries(dateCounts, startDate, endDate);
  }

  private com.capstone.be.dto.response.statistics.GlobalOrganizationStatisticsResponse.SummaryStatistics calculateGlobalOrganizationSummary(
      List<OrganizationProfile> organizations, List<Document> documents, List<UUID> documentIds,
      List<OrgEnrollment> enrollments, Instant startDate, Instant endDate) {
    long totalOrganizations = organizations.size();
    
    // Count total members (JOINED status only)
    long totalMembers = enrollments.stream()
        .filter(e -> e.getStatus() == com.capstone.be.domain.enums.OrgEnrollStatus.JOINED)
        .map(e -> e.getMember().getId())
        .distinct()
        .count();

    long totalDocuments = documents.size();
    long totalViews = documents.stream()
        .mapToLong(doc -> doc.getViewCount() != null ? doc.getViewCount() : 0L)
        .sum();
    long totalUpvotes = documents.stream()
        .mapToLong(doc -> doc.getUpvoteCount() != null ? doc.getUpvoteCount() : 0L)
        .sum();

    // Count comments on organization documents
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

    // Count active organizations (organizations with documents uploaded in last 30 days)
    LocalDate thirtyDaysAgo = LocalDate.now().minusDays(30);
    Instant thirtyDaysAgoInstant = thirtyDaysAgo.atStartOfDay(ZoneId.systemDefault()).toInstant();
    long activeOrganizations = documents.stream()
        .filter(doc -> doc.getCreatedAt().isAfter(thirtyDaysAgoInstant))
        .map(doc -> doc.getOrganization().getId())
        .distinct()
        .count();

    double avgMembersPerOrg = totalOrganizations > 0 ? (double) totalMembers / totalOrganizations : 0.0;
    double avgDocumentsPerOrg = totalOrganizations > 0 ? (double) totalDocuments / totalOrganizations : 0.0;
    double avgViewsPerOrg = totalOrganizations > 0 ? (double) totalViews / totalOrganizations : 0.0;

    return com.capstone.be.dto.response.statistics.GlobalOrganizationStatisticsResponse.SummaryStatistics.builder()
        .totalOrganizations(totalOrganizations)
        .totalMembers(totalMembers)
        .totalDocuments(totalDocuments)
        .totalViews(totalViews)
        .totalUpvotes(totalUpvotes)
        .totalComments(totalComments)
        .activeOrganizations(activeOrganizations)
        .averageMembersPerOrganization(avgMembersPerOrg)
        .averageDocumentsPerOrganization(avgDocumentsPerOrg)
        .averageViewsPerOrganization(avgViewsPerOrg)
        .build();
  }

  private List<com.capstone.be.dto.response.statistics.GlobalOrganizationStatisticsResponse.MemberCountBreakdown> calculateMemberCountBreakdown(
      List<OrganizationProfile> organizations, List<OrgEnrollment> enrollments) {
    // Count members per organization
    Map<UUID, Long> memberCounts = new HashMap<>();
    for (OrgEnrollment enrollment : enrollments) {
      if (enrollment.getStatus() == com.capstone.be.domain.enums.OrgEnrollStatus.JOINED) {
        UUID orgId = enrollment.getOrganization().getId();
        memberCounts.put(orgId, memberCounts.getOrDefault(orgId, 0L) + 1);
      }
    }

    // Collect all member counts to determine dynamic ranges
    List<Long> allMemberCounts = new ArrayList<>();
    for (OrganizationProfile org : organizations) {
      long memberCount = memberCounts.getOrDefault(org.getId(), 0L);
      allMemberCounts.add(memberCount);
    }

    // Calculate max member count to determine appropriate ranges
    long maxMemberCount = allMemberCounts.stream().mapToLong(Long::longValue).max().orElse(0L);

    // Define ranges based on max count (dynamic ranges)
    long range1_50 = 0;
    long range51_100 = 0;
    long range101_200 = 0;
    long range201_500 = 0;
    long range501_1000 = 0;
    long range1000Plus = 0;

    for (OrganizationProfile org : organizations) {
      long memberCount = memberCounts.getOrDefault(org.getId(), 0L);
      if (memberCount <= 50) {
        range1_50++;
      } else if (memberCount <= 100) {
        range51_100++;
      } else if (memberCount <= 200) {
        range101_200++;
      } else if (memberCount <= 500) {
        range201_500++;
      } else if (memberCount <= 1000) {
        range501_1000++;
      } else {
        range1000Plus++;
      }
    }

    List<com.capstone.be.dto.response.statistics.GlobalOrganizationStatisticsResponse.MemberCountBreakdown> breakdown = new ArrayList<>();
    breakdown.add(com.capstone.be.dto.response.statistics.GlobalOrganizationStatisticsResponse.MemberCountBreakdown.builder()
        .range("1-50")
        .count(range1_50)
        .build());
    breakdown.add(com.capstone.be.dto.response.statistics.GlobalOrganizationStatisticsResponse.MemberCountBreakdown.builder()
        .range("51-100")
        .count(range51_100)
        .build());
    breakdown.add(com.capstone.be.dto.response.statistics.GlobalOrganizationStatisticsResponse.MemberCountBreakdown.builder()
        .range("101-200")
        .count(range101_200)
        .build());
    breakdown.add(com.capstone.be.dto.response.statistics.GlobalOrganizationStatisticsResponse.MemberCountBreakdown.builder()
        .range("201-500")
        .count(range201_500)
        .build());
    breakdown.add(com.capstone.be.dto.response.statistics.GlobalOrganizationStatisticsResponse.MemberCountBreakdown.builder()
        .range("501-1000")
        .count(range501_1000)
        .build());
    breakdown.add(com.capstone.be.dto.response.statistics.GlobalOrganizationStatisticsResponse.MemberCountBreakdown.builder()
        .range("1000+")
        .count(range1000Plus)
        .build());

    return breakdown;
  }

  private List<com.capstone.be.dto.response.statistics.GlobalOrganizationStatisticsResponse.TimeSeriesData> calculateOrganizationDocumentUploadsTimeSeries(
      List<Document> documents, Instant startDate, Instant endDate) {
    Map<String, Long> dateCounts = new HashMap<>();

    for (Document doc : documents) {
      LocalDate date = doc.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate();
      String dateStr = date.format(DATE_FORMATTER);
      dateCounts.put(dateStr, dateCounts.getOrDefault(dateStr, 0L) + 1);
    }

    return buildGlobalOrganizationTimeSeries(dateCounts, startDate, endDate);
  }

  private List<com.capstone.be.dto.response.statistics.GlobalOrganizationStatisticsResponse.TimeSeriesData> calculateOrganizationDocumentViewsTimeSeries(
      List<UUID> documentIds, Instant startDate, Instant endDate) {
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

    return buildGlobalOrganizationTimeSeries(dateCounts, startDate, endDate);
  }

  private List<com.capstone.be.dto.response.statistics.GlobalOrganizationStatisticsResponse.TimeSeriesData> calculateOrganizationGrowthTimeSeries(
      List<OrganizationProfile> organizations, Instant startDate, Instant endDate) {
    Map<String, Long> dateCounts = new HashMap<>();

    for (OrganizationProfile org : organizations) {
      LocalDate date = org.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate();
      String dateStr = date.format(DATE_FORMATTER);
      dateCounts.put(dateStr, dateCounts.getOrDefault(dateStr, 0L) + 1);
    }

    return buildGlobalOrganizationTimeSeries(dateCounts, startDate, endDate);
  }

  private List<com.capstone.be.dto.response.statistics.GlobalOrganizationStatisticsResponse.TypeBreakdown> calculateOrganizationTypeBreakdown(
      List<OrganizationProfile> organizations) {
    Map<com.capstone.be.domain.enums.OrgType, Long> typeCounts = organizations.stream()
        .collect(Collectors.groupingBy(OrganizationProfile::getType, Collectors.counting()));

    return typeCounts.entrySet().stream()
        .map(entry -> com.capstone.be.dto.response.statistics.GlobalOrganizationStatisticsResponse.TypeBreakdown.builder()
            .type(entry.getKey().name())
            .count(entry.getValue())
            .build())
        .collect(Collectors.toList());
  }

  private List<com.capstone.be.dto.response.statistics.GlobalOrganizationStatisticsResponse.OrganizationBreakdown> calculateTopOrganizationsBreakdown(
      List<OrganizationProfile> organizations, List<Document> documents, List<OrgEnrollment> enrollments) {
    Map<UUID, OrganizationStats> orgStatsMap = new HashMap<>();

    // Initialize stats for all organizations
    for (OrganizationProfile org : organizations) {
      orgStatsMap.put(org.getId(), new OrganizationStats(org, 0L, 0L, 0L));
    }

    // Count documents per organization
    for (Document doc : documents) {
      if (doc.getOrganization() != null) {
        OrganizationStats stats = orgStatsMap.get(doc.getOrganization().getId());
        if (stats != null) {
          stats.documentCount++;
          stats.viewCount += doc.getViewCount() != null ? doc.getViewCount() : 0L;
        }
      }
    }

    // Count members per organization
    for (OrgEnrollment enrollment : enrollments) {
      if (enrollment.getStatus() == com.capstone.be.domain.enums.OrgEnrollStatus.JOINED) {
        OrganizationStats stats = orgStatsMap.get(enrollment.getOrganization().getId());
        if (stats != null) {
          stats.memberCount++;
        }
      }
    }

    // Calculate total score and create breakdown
    return orgStatsMap.values().stream()
        .map(stats -> {
          long totalScore = stats.documentCount * 10 + stats.memberCount * 5 + stats.viewCount / 100;
          return com.capstone.be.dto.response.statistics.GlobalOrganizationStatisticsResponse.OrganizationBreakdown.builder()
              .organizationId(stats.org.getId().toString())
              .organizationName(stats.org.getName())
              .memberCount(stats.memberCount)
              .documentCount(stats.documentCount)
              .viewCount(stats.viewCount)
              .totalScore(totalScore)
              .build();
        })
        .sorted((a, b) -> Long.compare(b.getTotalScore(), a.getTotalScore()))
        .limit(10)
        .collect(Collectors.toList());
  }

  private static class OrganizationStats {
    OrganizationProfile org;
    long memberCount;
    long documentCount;
    long viewCount;

    OrganizationStats(OrganizationProfile org, long memberCount, long documentCount, long viewCount) {
      this.org = org;
      this.memberCount = memberCount;
      this.documentCount = documentCount;
      this.viewCount = viewCount;
    }
  }
}
