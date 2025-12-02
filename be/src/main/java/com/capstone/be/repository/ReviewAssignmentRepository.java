package com.capstone.be.repository;

import com.capstone.be.domain.entity.ReviewAssignment;
import com.capstone.be.domain.enums.DocStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewAssignmentRepository extends JpaRepository<ReviewAssignment, UUID>,
    JpaSpecificationExecutor<ReviewAssignment> {

  /**
   * Find review assignment by document and reviewer
   */
  Optional<ReviewAssignment> findByDocument_IdAndReviewer_Id(UUID documentId, UUID reviewerId);

  /**
   * Find all review assignments for a reviewer
   */
  Page<ReviewAssignment> findByReviewer_Id(UUID reviewerId, Pageable pageable);

  /**
   * Find all review assignments for a document
   */
  List<ReviewAssignment> findByDocument_Id(UUID documentId);

  /**
   * Find review assignments by reviewer and status
   */
  Page<ReviewAssignment> findByReviewer_IdAndReviewStatus(
      UUID reviewerId, DocStatus status, Pageable pageable);

  /**
   * Count review assignments by reviewer and status
   */
  long countByReviewer_IdAndReviewStatus(UUID reviewerId, DocStatus status);

  /**
   * Count all review assignments for a reviewer
   */
  long countByReviewer_Id(UUID reviewerId);
}

