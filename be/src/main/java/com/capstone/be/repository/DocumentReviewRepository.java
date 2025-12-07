package com.capstone.be.repository;

import com.capstone.be.domain.entity.DocumentReview;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
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
}
