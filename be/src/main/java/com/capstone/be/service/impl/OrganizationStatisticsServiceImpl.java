package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.Comment;
import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.DocumentReadHistory;
import com.capstone.be.domain.entity.DocumentRedemption;
import com.capstone.be.domain.entity.DocumentVote;
import com.capstone.be.domain.entity.OrgEnrollment;
import com.capstone.be.domain.entity.OrganizationProfile;
import com.capstone.be.domain.entity.SavedListDocument;
import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.DocVisibility;
import com.capstone.be.domain.enums.OrgEnrollStatus;
import com.capstone.be.dto.response.statistics.OrganizationStatisticsResponse;
import com.capstone.be.dto.response.statistics.OrganizationStatisticsResponse.OrganizationInfo;
import com.capstone.be.dto.response.statistics.OrganizationStatisticsResponse.PremiumBreakdown;
import com.capstone.be.dto.response.statistics.OrganizationStatisticsResponse.StatusBreakdown;
import com.capstone.be.dto.response.statistics.OrganizationStatisticsResponse.SummaryStatistics;
import com.capstone.be.dto.response.statistics.OrganizationStatisticsResponse.TimeSeriesData;
import com.capstone.be.dto.response.statistics.OrganizationStatisticsResponse.TopContributor;
import com.capstone.be.dto.response.statistics.OrganizationStatisticsResponse.VisibilityBreakdown;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.repository.CommentRepository;
import com.capstone.be.repository.DocumentReadHistoryRepository;
import com.capstone.be.repository.DocumentRedemptionRepository;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.DocumentVoteRepository;
import com.capstone.be.repository.OrgEnrollmentRepository;
import com.capstone.be.repository.OrganizationProfileRepository;
import com.capstone.be.repository.SavedListDocumentRepository;
import com.capstone.be.service.OrganizationStatisticsService;
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
public class OrganizationStatisticsServiceImpl implements OrganizationStatisticsService {

  private final DocumentRepository documentRepository;
  private final DocumentReadHistoryRepository documentReadHistoryRepository;
  private final DocumentVoteRepository documentVoteRepository;
  private final CommentRepository commentRepository;
  private final SavedListDocumentRepository savedListDocumentRepository;
  private final DocumentRedemptionRepository documentRedemptionRepository;
  private final OrganizationProfileRepository organizationProfileRepository;
  private final OrgEnrollmentRepository orgEnrollmentRepository;

  private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

  @Override
  @Transactional(readOnly = true)
  public OrganizationStatisticsResponse getOrganizationStatistics(
      UUID organizationId, Instant startDate, Instant endDate) {
    log.info("Getting organization statistics for org {} from {} to {}", organizationId, startDate,
        endDate);

    // Get organization
    OrganizationProfile organization = organizationProfileRepository.findById(organizationId)
        .orElseThrow(() -> new ResourceNotFoundException("Organization", "id", organizationId));

    // Get all documents for this organization
    Specification<Document> docSpec = (root, query, cb) -> {
      var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
      predicates.add(cb.equal(root.get("organization").get("id"), organizationId));
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

    // Get all enrollments for this organization
    Specification<OrgEnrollment> enrollmentSpec = (root, query, cb) -> {
      var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
      predicates.add(cb.equal(root.get("organization").get("id"), organizationId));
      if (startDate != null) {
        predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
      }
      if (endDate != null) {
        predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
      }
      return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
    };

    List<OrgEnrollment> enrollments = orgEnrollmentRepository.findAll(enrollmentSpec);

    // Calculate summary statistics
    SummaryStatistics summary = calculateSummaryStatistics(
        organization, orgDocuments, documentIds, enrollments, startDate, endDate);

    // Calculate time series data
    List<TimeSeriesData> memberGrowth = calculateMemberGrowthTimeSeries(enrollments, startDate,
        endDate);
    List<TimeSeriesData> documentUploads = calculateDocumentUploadsTimeSeries(orgDocuments,
        startDate, endDate);
    List<TimeSeriesData> documentViews = calculateDocumentViewsTimeSeries(documentIds, startDate,
        endDate);
    List<TimeSeriesData> votesReceived = calculateVotesTimeSeries(documentIds, startDate, endDate);
    List<TimeSeriesData> commentsReceived = calculateCommentsTimeSeries(documentIds, startDate,
        endDate);
    List<TimeSeriesData> documentsSaved = calculateDocumentsSavedTimeSeries(documentIds, startDate,
        endDate);

    // Calculate breakdowns
    List<StatusBreakdown> memberStatusBreakdown = calculateMemberStatusBreakdown(enrollments);
    List<StatusBreakdown> documentStatusBreakdown = calculateDocumentStatusBreakdown(orgDocuments);
    List<VisibilityBreakdown> documentVisibilityBreakdown = calculateDocumentVisibilityBreakdown(
        orgDocuments);
    PremiumBreakdown premiumBreakdown = calculatePremiumBreakdown(orgDocuments);

    // Calculate top contributors
    List<TopContributor> topContributors = calculateTopContributors(orgDocuments, enrollments);

    // Build organization info
    OrganizationInfo orgInfo = OrganizationInfo.builder()
        .id(organization.getId().toString())
        .name(organization.getName())
        .type(organization.getType().name())
        .email(organization.getEmail())
        .createdAt(organization.getCreatedAt().toString())
        .build();

    return OrganizationStatisticsResponse.builder()
        .organization(orgInfo)
        .summary(summary)
        .memberGrowth(memberGrowth)
        .documentUploads(documentUploads)
        .documentViews(documentViews)
        .votesReceived(votesReceived)
        .commentsReceived(commentsReceived)
        .documentsSaved(documentsSaved)
        .memberStatusBreakdown(memberStatusBreakdown)
        .documentStatusBreakdown(documentStatusBreakdown)
        .documentVisibilityBreakdown(documentVisibilityBreakdown)
        .premiumBreakdown(premiumBreakdown)
        .topContributors(topContributors)
        .build();
  }

  private SummaryStatistics calculateSummaryStatistics(
      OrganizationProfile organization, List<Document> documents, List<UUID> documentIds,
      List<OrgEnrollment> enrollments, Instant startDate, Instant endDate) {
    long totalMembers = orgEnrollmentRepository.countByOrganizationAndStatus(organization,
        OrgEnrollStatus.JOINED);
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

    // Count active members (members who uploaded documents)
    long activeMembers = documents.stream()
        .map(Document::getUploader)
        .map(uploader -> uploader.getId())
        .distinct()
        .count();

    double avgViews = totalDocuments > 0 ? (double) totalViews / totalDocuments : 0.0;

    return SummaryStatistics.builder()
        .totalMembers(totalMembers)
        .totalDocuments(totalDocuments)
        .totalViews(totalViews)
        .totalUpvotes(totalUpvotes)
        .totalDownvotes(totalDownvotes)
        .totalComments(totalComments)
        .totalSaves(totalSaves)
        .totalPurchases(totalPurchases)
        .activeMembers(activeMembers)
        .averageViewsPerDocument(avgViews)
        .build();
  }

  private List<TimeSeriesData> calculateMemberGrowthTimeSeries(List<OrgEnrollment> enrollments,
      Instant startDate, Instant endDate) {
    Map<String, Long> dateCounts = new HashMap<>();

    for (OrgEnrollment enrollment : enrollments) {
      if (enrollment.getStatus() == OrgEnrollStatus.JOINED) {
        LocalDate date = enrollment.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate();
        String dateStr = date.format(DATE_FORMATTER);
        dateCounts.put(dateStr, dateCounts.getOrDefault(dateStr, 0L) + 1);
      }
    }

    return buildTimeSeries(dateCounts, startDate, endDate);
  }

  private List<TimeSeriesData> calculateDocumentUploadsTimeSeries(List<Document> documents,
      Instant startDate, Instant endDate) {
    Map<String, Long> dateCounts = new HashMap<>();

    for (Document doc : documents) {
      LocalDate date = doc.getCreatedAt().atZone(ZoneId.systemDefault()).toLocalDate();
      String dateStr = date.format(DATE_FORMATTER);
      dateCounts.put(dateStr, dateCounts.getOrDefault(dateStr, 0L) + 1);
    }

    return buildTimeSeries(dateCounts, startDate, endDate);
  }

  private List<TimeSeriesData> calculateDocumentViewsTimeSeries(List<UUID> documentIds,
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

    return buildTimeSeries(dateCounts, startDate, endDate);
  }

  private List<TimeSeriesData> calculateVotesTimeSeries(List<UUID> documentIds, Instant startDate,
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

    return buildTimeSeries(dateCounts, startDate, endDate);
  }

  private List<TimeSeriesData> calculateCommentsTimeSeries(List<UUID> documentIds,
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

    return buildTimeSeries(dateCounts, startDate, endDate);
  }

  private List<TimeSeriesData> calculateDocumentsSavedTimeSeries(List<UUID> documentIds,
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

    return buildTimeSeries(dateCounts, startDate, endDate);
  }

  private List<StatusBreakdown> calculateMemberStatusBreakdown(List<OrgEnrollment> enrollments) {
    Map<OrgEnrollStatus, Long> statusCounts = enrollments.stream()
        .collect(Collectors.groupingBy(OrgEnrollment::getStatus, Collectors.counting()));

    return statusCounts.entrySet().stream()
        .map(entry -> StatusBreakdown.builder()
            .status(entry.getKey().name())
            .count(entry.getValue())
            .build())
        .collect(Collectors.toList());
  }

  private List<StatusBreakdown> calculateDocumentStatusBreakdown(List<Document> documents) {
    Map<DocStatus, Long> statusCounts = documents.stream()
        .collect(Collectors.groupingBy(Document::getStatus, Collectors.counting()));

    return statusCounts.entrySet().stream()
        .map(entry -> StatusBreakdown.builder()
            .status(entry.getKey().name())
            .count(entry.getValue())
            .build())
        .collect(Collectors.toList());
  }

  private List<VisibilityBreakdown> calculateDocumentVisibilityBreakdown(
      List<Document> documents) {
    Map<DocVisibility, Long> visibilityCounts = documents.stream()
        .collect(Collectors.groupingBy(Document::getVisibility, Collectors.counting()));

    return visibilityCounts.entrySet().stream()
        .map(entry -> VisibilityBreakdown.builder()
            .visibility(entry.getKey().name())
            .count(entry.getValue())
            .build())
        .collect(Collectors.toList());
  }

  private PremiumBreakdown calculatePremiumBreakdown(List<Document> documents) {
    long premiumCount = documents.stream()
        .filter(doc -> Boolean.TRUE.equals(doc.getIsPremium()))
        .count();
    long freeCount = documents.size() - premiumCount;

    return PremiumBreakdown.builder()
        .premiumCount(premiumCount)
        .freeCount(freeCount)
        .build();
  }

  private List<TopContributor> calculateTopContributors(List<Document> documents,
      List<OrgEnrollment> enrollments) {
    // Count uploads per member
    Map<UUID, Long> uploadCounts = documents.stream()
        .collect(Collectors.groupingBy(
            doc -> doc.getUploader().getId(),
            Collectors.counting()));

    // Get top 10 contributors
    return uploadCounts.entrySet().stream()
        .sorted((e1, e2) -> Long.compare(e2.getValue(), e1.getValue()))
        .limit(10)
        .map(entry -> {
          UUID memberId = entry.getKey();
          long count = entry.getValue();

          // Find member info from enrollments or documents
          String memberName = documents.stream()
              .filter(doc -> doc.getUploader().getId().equals(memberId))
              .findFirst()
              .map(doc -> doc.getUploader().getFullName())
              .orElse("Unknown");

          String memberEmail = documents.stream()
              .filter(doc -> doc.getUploader().getId().equals(memberId))
              .findFirst()
              .map(doc -> doc.getUploader().getEmail())
              .orElse("");

          return TopContributor.builder()
              .memberId(memberId.toString())
              .memberName(memberName)
              .memberEmail(memberEmail)
              .uploadCount(count)
              .build();
        })
        .collect(Collectors.toList());
  }

  private List<TimeSeriesData> buildTimeSeries(Map<String, Long> dateCounts, Instant startDate,
      Instant endDate) {
    LocalDate start = startDate != null
        ? startDate.atZone(ZoneId.systemDefault()).toLocalDate()
        : LocalDate.now().minusMonths(6);
    LocalDate end = endDate != null
        ? endDate.atZone(ZoneId.systemDefault()).toLocalDate()
        : LocalDate.now();

    List<TimeSeriesData> series = new ArrayList<>();
    LocalDate current = start;
    while (!current.isAfter(end)) {
      String dateStr = current.format(DATE_FORMATTER);
      series.add(TimeSeriesData.builder()
          .date(dateStr)
          .count(dateCounts.getOrDefault(dateStr, 0L))
          .build());
      current = current.plusDays(1);
    }

    return series;
  }
}

