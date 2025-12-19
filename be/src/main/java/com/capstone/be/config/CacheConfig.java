package com.capstone.be.config;

import java.util.concurrent.TimeUnit;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Cache configuration for application
 * Uses Spring Cache abstraction with in-memory caching
 */
@Slf4j
@Configuration
@EnableCaching
@EnableScheduling
public class CacheConfig {

  public static final String TRENDING_DOCUMENTS_CACHE = "trendingDocuments";
  public static final String TRENDING_REVIEWERS_CACHE = "trendingReviewers";

  // Cache TTL configuration (in seconds)
  public static final long CACHE_TTL_SECONDS = TimeUnit.HOURS.toSeconds(1);
}
