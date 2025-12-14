package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.Comment;
import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.DocumentReadHistory;
import com.capstone.be.domain.entity.DocumentRedemption;
import com.capstone.be.domain.entity.DocumentVote;
import com.capstone.be.domain.entity.SavedListDocument;
import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.dto.response.statistics.PersonalDocumentStatisticsResponse;
import com.capstone.be.dto.response.statistics.PersonalDocumentStatisticsResponse.PremiumBreakdown;
import com.capstone.be.dto.response.statistics.PersonalDocumentStatisticsResponse.StatusBreakdown;
import com.capstone.be.dto.response.statistics.PersonalDocumentStatisticsResponse.SummaryStatistics;
import com.capstone.be.dto.response.statistics.PersonalDocumentStatisticsResponse.TimeSeriesData;
import com.capstone.be.repository.CommentRepository;
import com.capstone.be.repository.DocumentReadHistoryRepository;
import com.capstone.be.repository.DocumentRedemptionRepository;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.DocumentVoteRepository;
import com.capstone.be.repository.SavedListDocumentRepository;
import com.capstone.be.service.PersonalStatisticsService;
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
public class PersonalStatisticsServiceImpl implements PersonalStatisticsService {

  private final DocumentRepository documentRepository;
  private final DocumentReadHistoryRepository documentReadHistoryRepository;
  private final DocumentVoteRepository documentVoteRepository;
  private final CommentRepository commentRepository;
  private final SavedListDocumentRepository savedListDocumentRepository;
  private final DocumentRedemptionRepository documentRedemptionRepository;

  private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

  @Override
  @Transactional(readOnly = true)
  public PersonalDocumentStatisticsResponse getPersonalDocumentStatistics(
      UUID userId, Instant startDate, Instant endDate) {
    log.info("Getting personal document statistics for user {} from {} to {}", userId, startDate,
        endDate);

    // Get all documents uploaded by user
    Specification<Document> docSpec = (root, query, cb) -> {
      var predicates = new ArrayList<jakarta.persistence.criteria.Predicate>();
      predicates.add(cb.equal(root.get("uploader").get("id"), userId));
      if (startDate != null) {
        predicates.add(cb.greaterThanOrEqualTo(root.get("createdAt"), startDate));
      }
      if (endDate != null) {
        predicates.add(cb.lessThanOrEqualTo(root.get("createdAt"), endDate));
      }
      return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
    };

    List<Document> userDocuments = documentRepository.findAll(docSpec);
    List<UUID> documentIds = userDocuments.stream()
        .map(Document::getId)
        .collect(Collectors.toList());

    if (documentIds.isEmpty()) {
      return buildEmptyResponse();
    }

    // Calculate summary statistics
    SummaryStatistics summary = calculateSummaryStatistics(userDocuments, documentIds, startDate,
        endDate);

    // Calculate time series data
    List<TimeSeriesData> documentUploads = calculateDocumentUploadsTimeSeries(userDocuments,
        startDate, endDate);
    List<TimeSeriesData> documentViews = calculateDocumentViewsTimeSeries(documentIds, startDate,
        endDate);
    List<TimeSeriesData> votesReceived = calculateVotesTimeSeries(documentIds, startDate, endDate);
    List<TimeSeriesData> commentsReceived = calculateCommentsTimeSeries(documentIds, startDate,
        endDate);
    List<TimeSeriesData> documentsSaved = calculateDocumentsSavedTimeSeries(documentIds, startDate,
        endDate);

    // Calculate status breakdown
    List<StatusBreakdown> statusBreakdown = calculateStatusBreakdown(userDocuments);

    // Calculate premium breakdown
    PremiumBreakdown premiumBreakdown = calculatePremiumBreakdown(userDocuments);

    return PersonalDocumentStatisticsResponse.builder()
        .summary(summary)
        .documentUploads(documentUploads)
        .documentViews(documentViews)
        .votesReceived(votesReceived)
        .commentsReceived(commentsReceived)
        .documentsSaved(documentsSaved)
        .statusBreakdown(statusBreakdown)
        .premiumBreakdown(premiumBreakdown)
        .build();
  }

  private SummaryStatistics calculateSummaryStatistics(List<Document> documents,
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

    // Count purchases (redemptions) for premium documents
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

    double avgViews = totalDocuments > 0 ? (double) totalViews / totalDocuments : 0.0;
    double avgVotes = totalDocuments > 0 ? (double) (totalUpvotes + totalDownvotes) / totalDocuments
        : 0.0;

    return SummaryStatistics.builder()
        .totalDocumentsUploaded(totalDocuments)
        .totalViews(totalViews)
        .totalUpvotes(totalUpvotes)
        .totalDownvotes(totalDownvotes)
        .totalComments(totalComments)
        .totalSaves(totalSaves)
        .totalPurchases(totalPurchases)
        .averageViewsPerDocument(avgViews)
        .averageVotesPerDocument(avgVotes)
        .build();
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

  private List<StatusBreakdown> calculateStatusBreakdown(List<Document> documents) {
    Map<DocStatus, Long> statusCounts = documents.stream()
        .collect(Collectors.groupingBy(Document::getStatus, Collectors.counting()));

    return statusCounts.entrySet().stream()
        .map(entry -> StatusBreakdown.builder()
            .status(entry.getKey().name())
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

  private PersonalDocumentStatisticsResponse buildEmptyResponse() {
    return PersonalDocumentStatisticsResponse.builder()
        .summary(SummaryStatistics.builder()
            .totalDocumentsUploaded(0L)
            .totalViews(0L)
            .totalUpvotes(0L)
            .totalDownvotes(0L)
            .totalComments(0L)
            .totalSaves(0L)
            .totalPurchases(0L)
            .averageViewsPerDocument(0.0)
            .averageVotesPerDocument(0.0)
            .build())
        .documentUploads(new ArrayList<>())
        .documentViews(new ArrayList<>())
        .votesReceived(new ArrayList<>())
        .commentsReceived(new ArrayList<>())
        .documentsSaved(new ArrayList<>())
        .statusBreakdown(new ArrayList<>())
        .premiumBreakdown(PremiumBreakdown.builder()
            .premiumCount(0L)
            .freeCount(0L)
            .build())
        .build();
  }
}

