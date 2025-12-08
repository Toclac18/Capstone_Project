package com.capstone.be.service.impl;

import com.capstone.be.config.CacheConfig;
import com.capstone.be.domain.entity.DocumentReview;
import com.capstone.be.domain.entity.ReviewerProfile;
import com.capstone.be.domain.entity.User;
import com.capstone.be.dto.response.statistics.HomepageTrendingDocumentsResponse;
import com.capstone.be.dto.response.statistics.HomepageTrendingReviewersResponse;
import com.capstone.be.domain.entity.Document;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.DocumentReviewRepository;
import com.capstone.be.repository.ReviewerProfileRepository;
import com.capstone.be.service.TrendingDataCacheService;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
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
  private final DocumentReviewRepository documentReviewRepository;
  private final ReviewerProfileRepository reviewerProfileRepository;

  private static final int TOP_LIMIT = 5;
  private static final long SEVEN_DAYS_IN_SECONDS = 7 * 24 * 60 * 60;

  @Override
  @Cacheable(cacheNames = CacheConfig.TRENDING_DOCUMENTS_CACHE)
  public HomepageTrendingDocumentsResponse getTrendingDocuments() {
    log.debug("Fetching trending documents from cache");
    return buildTrendingDocumentsResponse();
  }

  @Override
  @Cacheable(cacheNames = CacheConfig.TRENDING_REVIEWERS_CACHE)
  public HomepageTrendingReviewersResponse getTrendingReviewers() {
    log.debug("Fetching trending reviewers from cache");
    return buildTrendingReviewersResponse();
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

  private HomepageTrendingDocumentsResponse buildTrendingDocumentsResponse() {
    Instant sevenDaysAgo = Instant.now().minusSeconds(SEVEN_DAYS_IN_SECONDS);
    Pageable pageable = PageRequest.of(0, TOP_LIMIT);

    Page<Document> topDocuments = documentRepository.findTopDocumentsLast7Days(sevenDaysAgo, pageable);

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

  private HomepageTrendingReviewersResponse buildTrendingReviewersResponse() {
    Instant sevenDaysAgo = Instant.now().minusSeconds(SEVEN_DAYS_IN_SECONDS);
    Pageable pageable = PageRequest.of(0, TOP_LIMIT);

    Page<Object[]> topReviewersData = documentReviewRepository.findTopReviewersLast7Days(
        sevenDaysAgo, pageable);

    List<HomepageTrendingReviewersResponse.TrendingReviewer> reviewers = topReviewersData
        .stream()
        .map(this::convertToTrendingReviewer)
        .collect(Collectors.toList());

    return HomepageTrendingReviewersResponse.builder()
        .reviewers(reviewers)
        .build();
  }

  private HomepageTrendingReviewersResponse.TrendingReviewer convertToTrendingReviewer(
      Object[] reviewerData) {
    User reviewer = (User) reviewerData[0];
    long totalReviews = ((Number) reviewerData[1]).longValue();
    long approvedCount = ((Number) reviewerData[2]).longValue();

    ReviewerProfile reviewerProfile = reviewerProfileRepository.findByUserId(reviewer.getId())
        .orElse(null);

    double approvalRate = totalReviews > 0 ? (double) approvedCount / totalReviews * 100 : 0;
    double performanceScore = calculatePerformanceScore(totalReviews, approvalRate);

    return HomepageTrendingReviewersResponse.TrendingReviewer.builder()
        .id(reviewer.getId())
        .fullName(reviewer.getFullName())
        .avatarUrl(reviewer.getAvatarKey())
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
