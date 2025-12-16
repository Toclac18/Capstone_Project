package com.capstone.be.config.seed;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.boot.context.event.ApplicationReadyEvent;

/**
 * Fixes review requests with invalid status 'COMPLETED' to 'ACCEPTED'
 * This is a one-time migration to fix data inconsistency
 * Runs automatically on application startup
 */
@Slf4j
@Component
@RequiredArgsConstructor
@Profile("!test") // Don't run in tests
public class ReviewRequestStatusFixer {

  private final JdbcTemplate jdbcTemplate;

  @Transactional
  @EventListener(ApplicationReadyEvent.class)
  public void fixReviewRequestStatus() {
    try {
      // Check if there are any review requests with invalid status 'COMPLETED'
      Integer count = jdbcTemplate.queryForObject(
          "SELECT COUNT(*) FROM review_request WHERE status = 'COMPLETED'",
          Integer.class
      );

      if (count != null && count > 0) {
        log.warn("Found {} review requests with invalid status 'COMPLETED'. Fixing to 'ACCEPTED'...", count);
        
        // Update all review requests with 'COMPLETED' status to 'ACCEPTED'
        // COMPLETED was likely meant to indicate the review was done, which maps to ACCEPTED
        int updated = jdbcTemplate.update(
            "UPDATE review_request SET status = 'ACCEPTED' WHERE status = 'COMPLETED'"
        );
        
        log.info("Successfully updated {} review requests from 'COMPLETED' to 'ACCEPTED'", updated);
      } else {
        log.debug("No review requests with invalid status 'COMPLETED' found. Migration not needed.");
      }
    } catch (Exception e) {
      log.error("Error fixing review request status: {}", e.getMessage(), e);
      // Don't throw exception to prevent app startup failure
      // The migration can be run manually via SQL if needed
    }
  }
}
