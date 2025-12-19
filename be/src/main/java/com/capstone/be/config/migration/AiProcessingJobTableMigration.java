package com.capstone.be.config.migration;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.boot.context.event.ApplicationReadyEvent;

/**
 * Migration component to create ai_processing_jobs table if it doesn't exist.
 * Runs automatically on application startup.
 * This ensures the table exists even if JPA auto-ddl fails or is disabled.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@Profile("!test") // Don't run in tests
public class AiProcessingJobTableMigration {

  private final JdbcTemplate jdbcTemplate;

  @EventListener(ApplicationReadyEvent.class)
  public void createAiProcessingJobsTable() {
    try {
      // Check if table exists
      String checkTableSql = """
          SELECT EXISTS (
              SELECT FROM information_schema.tables 
              WHERE table_schema = 'public' 
              AND table_name = 'ai_processing_jobs'
          )
          """;
      
      Boolean tableExists = jdbcTemplate.queryForObject(checkTableSql, Boolean.class);
      
      if (Boolean.TRUE.equals(tableExists)) {
        log.debug("Table ai_processing_jobs already exists. Migration not needed.");
        return;
      }

      log.info("Table ai_processing_jobs does not exist. Creating table...");

      // Create table (without transaction to avoid issues)
      String createTableSql = """
          CREATE TABLE IF NOT EXISTS ai_processing_jobs (
              id UUID PRIMARY KEY,
              document_id UUID NOT NULL,
              job_id VARCHAR(100) NOT NULL UNIQUE,
              status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
              filename VARCHAR(500),
              error_message TEXT,
              callback_url VARCHAR(500),
              started_at BIGINT,
              completed_at BIGINT,
              processing_time_seconds DOUBLE PRECISION,
              created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
              CONSTRAINT fk_ai_processing_jobs_document 
                  FOREIGN KEY (document_id) 
                  REFERENCES documents(id) 
                  ON DELETE CASCADE
          )
          """;

      jdbcTemplate.execute(createTableSql);
      log.info("✓ Created table ai_processing_jobs");

      // Create indexes
      String[] indexSqls = {
          "CREATE INDEX IF NOT EXISTS idx_ai_processing_jobs_job_id ON ai_processing_jobs(job_id)",
          "CREATE INDEX IF NOT EXISTS idx_ai_processing_jobs_document_id ON ai_processing_jobs(document_id)",
          "CREATE INDEX IF NOT EXISTS idx_ai_processing_jobs_status ON ai_processing_jobs(status)",
          "CREATE INDEX IF NOT EXISTS idx_ai_processing_jobs_created_at ON ai_processing_jobs(created_at)"
      };

      for (String indexSql : indexSqls) {
        try {
          jdbcTemplate.execute(indexSql);
          log.debug("Created index: {}", indexSql);
        } catch (Exception e) {
          log.warn("Index might already exist or failed to create: {}", e.getMessage());
          // Continue with next index
        }
      }

      log.info("✓ Created indexes for ai_processing_jobs table");

    } catch (Exception e) {
      log.error("Error creating ai_processing_jobs table: {}", e.getMessage(), e);
      // Don't throw exception to prevent app startup failure
      // The table will be created by JPA auto-ddl or manually via SQL script
    }
  }
}

