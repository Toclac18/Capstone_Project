package com.capstone.be.repository;

import com.capstone.be.domain.entity.DocumentReview;
import java.time.Instant;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

/**
 * Repository interface for DocumentReview entity
 */
@Repository
public interface DocumentReviewRepository extends JpaRepository<DocumentReview, UUID>,
    JpaSpecificationExecutor<DocumentReview> {

  /**
   * Find review by review request ID
   */
  Optional<DocumentReview> findByReviewRequest_Id(UUID reviewRequestId);

  /**
   * Find all reviews submitted by a specific reviewer
   */
  Page<DocumentReview> findByReviewer_Id(UUID reviewerId, Pageable pageable);

  /**
   * Find all reviews for a specific document
   */
  Page<DocumentReview> findByDocument_Id(UUID documentId, Pageable pageable);

  /**
   * Check if a review exists for a review request
   */
  boolean existsByReviewRequest_Id(UUID reviewRequestId);

  /**
   * Find top reviewers by number of reviews submitted in the last 7 days
   */
  @Query(value = """
      SELECT u.id, u.full_name, u.avatar_key,
             COUNT(dr.id) as review_count,
             SUM(CASE WHEN dr.decision = 'APPROVED' THEN 1 ELSE 0 END) as approved_count
      FROM document_review dr
      INNER JOIN users u ON dr.reviewer_id = u.id
      WHERE dr.submitted_at >= :sevenDaysAgo
      GROUP BY u.id, u.full_name, u.avatar_key
      ORDER BY review_count DESC, approved_count DESC
      """, nativeQuery = true)
  Page<Object[]> findTopReviewersLast7Days(
      @Param("sevenDaysAgo") Instant sevenDaysAgo,
      Pageable pageable
  );

  /**
   * Find top reviewers by number of reviews submitted (all time)
   */
  @Query(value = """
      SELECT u.id, u.full_name, u.avatar_key,
             COUNT(dr.id) as review_count,
             SUM(CASE WHEN dr.decision = 'APPROVED' THEN 1 ELSE 0 END) as approved_count
      FROM document_review dr
      INNER JOIN users u ON dr.reviewer_id = u.id
      GROUP BY u.id, u.full_name, u.avatar_key
      ORDER BY review_count DESC, approved_count DESC
      """, nativeQuery = true)
  Page<Object[]> findTopReviewersAllTime(
      Pageable pageable
  );
}
