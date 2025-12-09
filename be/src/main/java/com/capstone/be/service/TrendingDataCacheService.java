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
   * @param forceRefresh If true, bypass cache and fetch fresh data
   * @return Trending reviewers from cache or fresh data
   */
  HomepageTrendingReviewersResponse getTrendingReviewers(Boolean forceRefresh);

  /**
   * Refresh trending documents cache (called by scheduler)
   */
  void refreshTrendingDocumentsCache();

  /**
   * Refresh trending reviewers cache (called by scheduler)
   */
  void refreshTrendingReviewersCache();
}
