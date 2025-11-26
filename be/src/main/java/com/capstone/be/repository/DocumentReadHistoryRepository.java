package com.capstone.be.repository;

import com.capstone.be.domain.entity.DocumentReadHistory;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DocumentReadHistoryRepository extends JpaRepository<DocumentReadHistory, UUID> {

  /**
   * Find read history for a specific user
   */
  Page<DocumentReadHistory> findByUser_Id(UUID userId, Pageable pageable);

  /**
   * Find all read history records for a user and document
   */
  List<DocumentReadHistory> findByUser_IdAndDocument_Id(UUID userId, UUID documentId);

  /**
   * Find the most recent read history for a user and document
   */
  Optional<DocumentReadHistory> findFirstByUser_IdAndDocument_IdOrderByCreatedAtDesc(
      UUID userId, UUID documentId);

  /**
   * Check if user has read a document
   */
  boolean existsByUser_IdAndDocument_Id(UUID userId, UUID documentId);

  /**
   * Delete read history records older than the specified date
   * For cleanup of expired history (e.g., older than 30 days)
   *
   * @param cutoffDate Records created before this date will be deleted
   * @return Number of records deleted
   */
  @Modifying
  @Query("DELETE FROM DocumentReadHistory drh WHERE drh.createdAt < :cutoffDate")
  int deleteByCreatedAtBefore(@Param("cutoffDate") Instant cutoffDate);

  /**
   * Count read history records older than the specified date
   * For logging purposes before cleanup
   */
  long countByCreatedAtBefore(Instant cutoffDate);
}
