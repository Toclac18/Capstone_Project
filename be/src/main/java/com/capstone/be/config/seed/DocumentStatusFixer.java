package com.capstone.be.config.seed;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Fixes documents with old status 'VERIFIED' or 'AI_VERIFIED' to 'PENDING_REVIEW'
 * This is a one-time migration to fix data inconsistency
 * Runs automatically on application startup
 */
@Slf4j
@Component
@RequiredArgsConstructor
@Profile("!test") // Don't run in tests
public class DocumentStatusFixer {

  private final JdbcTemplate jdbcTemplate;

  @Transactional
  @EventListener(org.springframework.boot.context.event.ApplicationReadyEvent.class)
  public void fixDocumentStatus() {
    try {
      // Check if there are any documents with old status 'VERIFIED' or 'AI_VERIFIED'
      Integer count = jdbcTemplate.queryForObject(
          "SELECT COUNT(*) FROM document WHERE status IN ('VERIFIED', 'AI_VERIFIED')",
          Integer.class
      );

      if (count != null && count > 0) {
        log.warn("Found {} documents with old status 'VERIFIED' or 'AI_VERIFIED'. Fixing to 'PENDING_REVIEW'...", count);
        
        // Update all documents with old status to 'PENDING_REVIEW'
        int updated = jdbcTemplate.update(
            "UPDATE document SET status = 'PENDING_REVIEW' WHERE status IN ('VERIFIED', 'AI_VERIFIED')"
        );
        
        log.info("Successfully updated {} documents to 'PENDING_REVIEW'", updated);
      } else {
        log.debug("No documents with old status found. Migration not needed.");
      }
    } catch (Exception e) {
      log.error("Error fixing document status: {}", e.getMessage(), e);
      // Don't throw exception to prevent app startup failure
      // The migration can be run manually via SQL if needed
    }
  }
}

