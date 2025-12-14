package com.capstone.be.config;

import com.capstone.be.repository.SystemLogRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

/**
 * Scheduled job to delete old system logs based on retention policy
 * Runs daily at 2:00 AM to clean up logs older than retention period
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class LogRetentionJob {

    private final SystemLogRepository systemLogRepository;

    @Value("${app.audit.log.retention-days:180}")
    private int retentionDays; // Default 6 months (180 days)

    @Value("${app.audit.log.retention-enabled:true}")
    private boolean retentionEnabled;

    /**
     * Delete logs older than retention period
     * Runs daily at 2:00 AM
     */
    @Scheduled(cron = "${app.audit.log.retention-cron:0 0 2 * * ?}")
    public void deleteOldLogs() {
        if (!retentionEnabled) {
            log.debug("Log retention is disabled, skipping cleanup");
            return;
        }

        try {
            Instant cutoffDate = Instant.now().minus(retentionDays, ChronoUnit.DAYS);

            // Count logs to be deleted (for monitoring)
            long countToDelete = systemLogRepository.countByCreatedAtBefore(cutoffDate);

            if (countToDelete == 0) {
                log.debug("No logs to delete (older than {} days)", retentionDays);
                return;
            }

            log.info("Starting log retention cleanup: {} logs older than {} days will be deleted", 
                countToDelete, retentionDays);

            // Delete logs
            systemLogRepository.deleteByCreatedAtBefore(cutoffDate);

            log.info("Log retention cleanup completed: {} logs deleted (older than {} days)", 
                countToDelete, retentionDays);

        } catch (Exception e) {
            log.error("Error during log retention cleanup: {}", e.getMessage(), e);
        }
    }

    /**
     * Manual trigger for testing (can be called via admin endpoint if needed)
     */
    public void triggerCleanup() {
        log.info("Manual log retention cleanup triggered");
        deleteOldLogs();
    }
}

