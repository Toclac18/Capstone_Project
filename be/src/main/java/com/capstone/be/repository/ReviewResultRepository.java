package com.capstone.be.repository;

import com.capstone.be.domain.entity.ReviewResult;
import com.capstone.be.domain.enums.ReviewResultStatus;
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
 * Repository interface for ReviewResult entity
 */
@Repository
public interface ReviewResultRepository extends JpaRepository<ReviewResult, UUID>,
    JpaSpecificationExecutor<ReviewResult> {

  /**
   * Find the latest review result by review request ID (ordered by submittedAt desc)
   */
  Optional<ReviewResult> findFirstByReviewRequest_IdOrderBySubmittedAtDesc(UUID reviewRequestId);

  /**
   * Find all review results for a review request (history)
   */
  Page<ReviewResult> findByReviewRequest_IdOrderBySubmittedAtDesc(UUID reviewRequestId, Pageable pageable);

  /**
   * Find all review results submitted by a specific reviewer
   */
  Page<ReviewResult> findByReviewer_Id(UUID reviewerId, Pageable pageable);

  /**
   * Find all review results for a specific document
   */
  Page<ReviewResult> findByDocument_Id(UUID documentId, Pageable pageable);

  /**
   * Check if a review result exists for a review request
   */
  boolean existsByReviewRequest_Id(UUID reviewRequestId);

  /**
   * Check if there's a non-rejected review result for a review request
   * (PENDING or APPROVED means reviewer cannot submit again)
   */
  boolean existsByReviewRequest_IdAndStatusNot(UUID reviewRequestId, ReviewResultStatus status);

  /**
   * Find all review results by status (for BA approval workflow)
   */
  Page<ReviewResult> findByStatus(ReviewResultStatus status, Pageable pageable);

  /**
   * Find top reviewers by number of reviews submitted in the last 7 days
   */
  @Query(value = """
      SELECT u.id, u.full_name, u.avatar_key,
             COUNT(rr.id) as review_count,
             SUM(CASE WHEN rr.decision = 'APPROVED' THEN 1 ELSE 0 END) as approved_count
      FROM review_result rr
      INNER JOIN users u ON rr.reviewer_id = u.id
      WHERE rr.submitted_at >= :sevenDaysAgo
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
             COUNT(rr.id) as review_count,
             SUM(CASE WHEN rr.decision = 'APPROVED' THEN 1 ELSE 0 END) as approved_count
      FROM review_result rr
      INNER JOIN users u ON rr.reviewer_id = u.id
      GROUP BY u.id, u.full_name, u.avatar_key
      ORDER BY review_count DESC, approved_count DESC
      """, nativeQuery = true)
  Page<Object[]> findTopReviewersAllTime(
      Pageable pageable
  );

  /**
   * Count submitted review results for a specific document
   */
  long countByReviewRequest_Document_IdAndSubmittedAtIsNotNull(UUID documentId);

  /**
   * Count all submitted review results
   */
  long countBySubmittedAtIsNotNull();
}
