package com.capstone.be.scheduler;

import com.capstone.be.repository.DocumentReadHistoryRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Scheduled job to cleanup expired document read history records
 * Runs daily to delete records older than configured retention period
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DocumentReadHistoryCleanupScheduler {

  private final DocumentReadHistoryRepository documentReadHistoryRepository;

  @Value("${app.document.readHistory.retentionDays:30}")
  private int retentionDays;

  /**
   * Cleanup expired read history records
   * Runs every day at 2:00 AM
   */
  @Scheduled(cron = "0 0 2 * * ?")
  @Transactional
  public void cleanupExpiredReadHistory() {
    log.info("Starting cleanup of expired document read history (retention: {} days)",
        retentionDays);

    try {
      // Calculate cutoff date (e.g., 30 days ago)
      Instant cutoffDate = Instant.now().minus(retentionDays, ChronoUnit.DAYS);

      // Count records to be deleted (for logging)
      long countToDelete = documentReadHistoryRepository.countByCreatedAtBefore(cutoffDate);

      if (countToDelete == 0) {
        log.info("No expired read history records found to delete");
        return;
      }

      log.info("Found {} read history records older than {} days to delete",
          countToDelete, retentionDays);

      // Delete expired records
      int deletedCount = documentReadHistoryRepository.deleteByCreatedAtBefore(cutoffDate);

      log.info("Successfully deleted {} expired read history records (cutoff date: {})",
          deletedCount, cutoffDate);

    } catch (Exception e) {
      log.error("Error during read history cleanup", e);
      // Don't rethrow - we don't want to stop the scheduler
    }
  }
}
