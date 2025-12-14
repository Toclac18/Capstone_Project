package com.capstone.be.config.seed;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Fixes documents with old status 'VERIFIED' to 'AI_VERIFIED'
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
      // Check if there are any documents with status 'VERIFIED'
      Integer count = jdbcTemplate.queryForObject(
          "SELECT COUNT(*) FROM document WHERE status = 'VERIFIED'",
          Integer.class
      );

      if (count != null && count > 0) {
        log.warn("Found {} documents with old status 'VERIFIED'. Fixing to 'AI_VERIFIED'...", count);
        
        // Update all documents with status 'VERIFIED' to 'AI_VERIFIED'
        int updated = jdbcTemplate.update(
            "UPDATE document SET status = 'AI_VERIFIED' WHERE status = 'VERIFIED'"
        );
        
        log.info("Successfully updated {} documents from 'VERIFIED' to 'AI_VERIFIED'", updated);
      } else {
        log.debug("No documents with old status 'VERIFIED' found. Migration not needed.");
      }
    } catch (Exception e) {
      log.error("Error fixing document status from 'VERIFIED' to 'AI_VERIFIED': {}", e.getMessage(), e);
      // Don't throw exception to prevent app startup failure
      // The migration can be run manually via SQL if needed
    }
  }
}

