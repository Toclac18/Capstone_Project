package com.capstone.be.service.impl;

import com.capstone.be.config.CacheConfig;
import com.capstone.be.domain.entity.ReviewerProfile;
import com.capstone.be.domain.entity.User;
import com.capstone.be.dto.response.statistics.HomepageTrendingDocumentsResponse;
import com.capstone.be.dto.response.statistics.HomepageTrendingReviewersResponse;
import com.capstone.be.domain.entity.Document;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.ReviewResultRepository;
import com.capstone.be.repository.ReviewerProfileRepository;
import com.capstone.be.service.TrendingDataCacheService;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Service implementation for managing trending data cache
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class TrendingDataCacheServiceImpl implements TrendingDataCacheService {

  private final DocumentRepository documentRepository;
  private final ReviewResultRepository reviewResultRepository;
  private final ReviewerProfileRepository reviewerProfileRepository;

  private static final int TOP_LIMIT = 5;
  private static final long SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60;

  @Override
  @Transactional(readOnly = true)
  @Cacheable(cacheNames = CacheConfig.TRENDING_DOCUMENTS_CACHE)
  public HomepageTrendingDocumentsResponse getTrendingDocuments() {
    log.debug("Fetching trending documents from cache");
    return buildTrendingDocumentsResponse();
  }

  @Override
  @Transactional(readOnly = true)
  public HomepageTrendingReviewersResponse getTrendingReviewers(Boolean forceRefresh) {
    if (Boolean.TRUE.equals(forceRefresh)) {
      log.info("Force refreshing trending reviewers (bypassing cache)");
      // Evict cache and rebuild
      evictTrendingReviewersCache();
      return buildTrendingReviewersResponse();
    } else {
      log.debug("Fetching trending reviewers from cache");
      return getCachedTrendingReviewers();
    }
  }

  @Cacheable(cacheNames = CacheConfig.TRENDING_REVIEWERS_CACHE)
  private HomepageTrendingReviewersResponse getCachedTrendingReviewers() {
    return buildTrendingReviewersResponse();
  }

  @CacheEvict(cacheNames = CacheConfig.TRENDING_REVIEWERS_CACHE, allEntries = true)
  private void evictTrendingReviewersCache() {
    log.debug("Evicting trending reviewers cache");
  }

  @Override
  @Scheduled(fixedDelay = 3600000) // Every 1 hour
  @CacheEvict(cacheNames = CacheConfig.TRENDING_DOCUMENTS_CACHE, allEntries = true)
  @Transactional(readOnly = true)
  public void refreshTrendingDocumentsCache() {
    log.info("Refreshing trending documents cache");
    buildTrendingDocumentsResponse(); // Trigger cache update
  }

  @Override
  @Scheduled(fixedDelay = 3600000) // Every 1 hour
  @CacheEvict(cacheNames = CacheConfig.TRENDING_REVIEWERS_CACHE, allEntries = true)
  @Transactional(readOnly = true)
  public void refreshTrendingReviewersCache() {
    log.info("Refreshing trending reviewers cache");
    buildTrendingReviewersResponse(); // Trigger cache update
  }

  @Transactional(readOnly = true)
  private HomepageTrendingDocumentsResponse buildTrendingDocumentsResponse() {
    Instant sevenDaysAgo = Instant.now().minusSeconds(SEVEN_DAYS_IN_SECONDS);
    Pageable pageable = PageRequest.of(0, TOP_LIMIT);

    Page<Document> topDocuments = documentRepository.findTopDocumentsLast7Days(sevenDaysAgo, pageable);

    // Force initialize lazy-loaded properties within transaction
    // This ensures all data is loaded before caching
    topDocuments.getContent().forEach(document -> {
      // Force initialization of lazy properties
      if (document.getDocType() != null) {
        document.getDocType().getName(); // Force load
      }
      if (document.getSpecialization() != null) {
        document.getSpecialization().getName(); // Force load
      }
      if (document.getUploader() != null) {
        document.getUploader().getFullName(); // Force load
        document.getUploader().getAvatarKey(); // Force load
      }
    });

    // Convert to DTOs within transaction to access lazy-loaded properties
    List<HomepageTrendingDocumentsResponse.TrendingDocument> documents = topDocuments
        .stream()
        .map(this::convertToTrendingDocument)
        .collect(Collectors.toList());

    return HomepageTrendingDocumentsResponse.builder()
        .documents(documents)
        .build();
  }

  private HomepageTrendingDocumentsResponse.TrendingDocument convertToTrendingDocument(
      Document document) {
    User uploader = document.getUploader();
    double engagementScore = calculateEngagementScore(document);

    return HomepageTrendingDocumentsResponse.TrendingDocument.builder()
        .id(document.getId())
        .title(document.getTitle())
        .description(document.getDescription())
        .thumbnailUrl(document.getThumbnailKey())
        .docType(document.getDocType() != null ? document.getDocType().getName() : null)
        .specialization(
            document.getSpecialization() != null ? document.getSpecialization().getName() : null)
        .viewCount(document.getViewCount().longValue())
        .voteScore(document.getVoteScore())
        .engagementScore(engagementScore)
        .createdAt(document.getCreatedAt())
        .uploader(HomepageTrendingDocumentsResponse.TrendingDocument.UploaderInfo.builder()
            .id(uploader.getId())
            .fullName(uploader.getFullName())
            .avatarUrl(uploader.getAvatarKey())
            .build())
        .build();
  }

  @Transactional(readOnly = true)
  private HomepageTrendingReviewersResponse buildTrendingReviewersResponse() {
    Instant sevenDaysAgo = Instant.now().minusSeconds(SEVEN_DAYS_IN_SECONDS);
    Pageable pageable = PageRequest.of(0, TOP_LIMIT);

    // First, get top reviewers from last 7 days
    Page<Object[]> topReviewersLast7Days = reviewResultRepository.findTopReviewersLast7Days(
        sevenDaysAgo, pageable);

    List<HomepageTrendingReviewersResponse.TrendingReviewer> reviewers = topReviewersLast7Days
        .getContent()
        .stream()
        .map(this::convertToTrendingReviewer)
        .collect(Collectors.toList());

    // If we don't have enough reviewers (less than TOP_LIMIT), fill with all-time top reviewers
    if (reviewers.size() < TOP_LIMIT) {
      // Get IDs of reviewers we already have
      Set<UUID> existingReviewerIds = reviewers.stream()
          .map(HomepageTrendingReviewersResponse.TrendingReviewer::getId)
          .collect(Collectors.toSet());

      // Fetch more reviewers from all time (enough to fill to TOP_LIMIT)
      int needed = TOP_LIMIT - reviewers.size();
      Pageable allTimePageable = PageRequest.of(0, TOP_LIMIT * 2); // Get more to filter out duplicates

      Page<Object[]> allTimeReviewersData = reviewResultRepository.findTopReviewersAllTime(
          allTimePageable);

      // Filter out reviewers we already have and add until we reach TOP_LIMIT
      List<HomepageTrendingReviewersResponse.TrendingReviewer> additionalReviewers = allTimeReviewersData
          .getContent()
          .stream()
          .map(this::convertToTrendingReviewer)
          .filter(reviewer -> !existingReviewerIds.contains(reviewer.getId()))
          .limit(needed)
          .collect(Collectors.toList());

      reviewers.addAll(additionalReviewers);
    }

    // Ensure we only return TOP_LIMIT reviewers
    reviewers = reviewers.stream()
        .limit(TOP_LIMIT)
        .collect(Collectors.toList());

    return HomepageTrendingReviewersResponse.builder()
        .reviewers(reviewers)
        .build();
  }

  private HomepageTrendingReviewersResponse.TrendingReviewer convertToTrendingReviewer(
      Object[] reviewerData) {
    // Native query returns: [UUID id, String fullName, String avatarKey, Long review_count, Long approved_count]
    // Handle UUID - may come as UUID or String from native query
    UUID reviewerId;
    if (reviewerData[0] instanceof UUID) {
      reviewerId = (UUID) reviewerData[0];
    } else if (reviewerData[0] instanceof String) {
      reviewerId = UUID.fromString((String) reviewerData[0]);
    } else {
      reviewerId = UUID.fromString(reviewerData[0].toString());
    }
    
    String fullName = reviewerData[1] != null ? reviewerData[1].toString() : null;
    String avatarKey = reviewerData[2] != null ? reviewerData[2].toString() : null;
    long totalReviews = reviewerData[3] != null ? ((Number) reviewerData[3]).longValue() : 0;
    long approvedCount = reviewerData[4] != null ? ((Number) reviewerData[4]).longValue() : 0;

    // Debug log to check avatarKey
    log.info("Converting reviewer: id={}, fullName={}, avatarKey={}, totalReviews={}, approvedCount={}", 
        reviewerId, fullName, avatarKey, totalReviews, approvedCount);

    ReviewerProfile reviewerProfile = reviewerProfileRepository.findByUserId(reviewerId)
        .orElse(null);

    double approvalRate = totalReviews > 0 ? (double) approvedCount / totalReviews * 100 : 0;
    double performanceScore = calculatePerformanceScore(totalReviews, approvalRate);

    return HomepageTrendingReviewersResponse.TrendingReviewer.builder()
        .id(reviewerId)
        .fullName(fullName)
        .avatarUrl(avatarKey)
        .organizationName(
            reviewerProfile != null ? reviewerProfile.getOrganizationName() : null)
        .totalReviewsSubmitted(totalReviews)
        .approvalRate(approvalRate)
        .performanceScore(performanceScore)
        .build();
  }

  private double calculateEngagementScore(Document document) {
    long viewWeight = document.getViewCount() * 1;
    long upvoteWeight = Math.max(0, document.getVoteScore()) * 3;
    long downvoteWeight = Math.max(0, -document.getVoteScore()) * 2;

    return (double) (viewWeight + upvoteWeight - downvoteWeight);
  }

  private double calculatePerformanceScore(long totalReviews, double approvalRate) {
    double normalizedReviews = Math.min(totalReviews / 100.0 * 60, 60);
    return normalizedReviews + (approvalRate * 0.4);
  }
}
