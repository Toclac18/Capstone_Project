package com.capstone.be.service;

import com.capstone.be.dto.response.statistics.HomepageTrendingDocumentsResponse;
import com.capstone.be.dto.response.statistics.HomepageTrendingReviewersResponse;

/**
 * Service interface for managing trending data cache
 */
public interface TrendingDataCacheService {

  /**
   * Get cached trending documents
   * @return Trending documents from cache
   */
  HomepageTrendingDocumentsResponse getTrendingDocuments();

  /**
   * Get cached trending reviewers
   * @return Trending reviewers from cache
   */
  HomepageTrendingReviewersResponse getTrendingReviewers();

  /**
   * Refresh trending documents cache (called by scheduler)
   */
  void refreshTrendingDocumentsCache();

  /**
   * Refresh trending reviewers cache (called by scheduler)
   */
  void refreshTrendingReviewersCache();
}
