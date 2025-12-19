package com.capstone.be.repository;

import com.capstone.be.domain.entity.AiProcessingJob;
import com.capstone.be.domain.enums.AiJobStatus;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

/**
 * Repository for AI processing jobs
 */
@Repository
public interface AiProcessingJobRepository extends JpaRepository<AiProcessingJob, UUID>,
    JpaSpecificationExecutor<AiProcessingJob> {

  /**
   * Find job by jobId (from AI service)
   */
  Optional<AiProcessingJob> findByJobId(String jobId);

  /**
   * Find job by document ID
   */
  Optional<AiProcessingJob> findByDocumentId(UUID documentId);

  /**
   * Find job by document ID and status
   */
  Optional<AiProcessingJob> findByDocumentIdAndStatus(UUID documentId, AiJobStatus status);

  /**
   * Check if job exists by jobId
   */
  boolean existsByJobId(String jobId);
}

