package com.capstone.be.repository;

import com.capstone.be.domain.entity.ReviewRequest;
import com.capstone.be.domain.enums.ReviewRequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReviewRequestRepository extends JpaRepository<ReviewRequest, UUID>,
    JpaSpecificationExecutor<ReviewRequest> {

  // Tìm review request theo document và reviewer
  Optional<ReviewRequest> findByDocument_IdAndReviewer_Id(UUID documentId, UUID reviewerId);

  // Lấy tất cả review request của một reviewer (xem lời mời)
  Page<ReviewRequest> findByReviewer_Id(UUID reviewerId, Pageable pageable);

  // Lấy review request của reviewer theo status
  Page<ReviewRequest> findByReviewer_IdAndStatus(
      UUID reviewerId,
      ReviewRequestStatus status,
      Pageable pageable
  );

  // Lấy tất cả review request của một document
  Page<ReviewRequest> findByDocument_Id(UUID documentId, Pageable pageable);

  // Lấy review request của document theo status
  Page<ReviewRequest> findByDocument_IdAndStatus(
      UUID documentId,
      ReviewRequestStatus status,
      Pageable pageable
  );

  // Đếm số review request đang pending của reviewer
  long countByReviewer_IdAndStatus(UUID reviewerId, ReviewRequestStatus status);
  
  // Đếm số review request của document theo status
  long countByDocument_IdAndStatus(UUID documentId, ReviewRequestStatus status);

  // Kiểm tra document đã được assign cho reviewer chưa
  boolean existsByDocument_IdAndReviewer_Id(UUID documentId, UUID reviewerId);

  // Lấy review request đang pending của một document (để BA biết đã assign cho ai)
  @Query("""
      SELECT rr FROM ReviewRequest rr
      WHERE rr.document.id = :documentId
        AND rr.status = com.capstone.be.domain.enums.ReviewRequestStatus.PENDING
      """)
  Page<ReviewRequest> findPendingRequestsByDocument(@Param("documentId") UUID documentId, Pageable pageable);

  // Tìm tất cả PENDING review requests có response deadline đã qua
  @Query("""
      SELECT rr FROM ReviewRequest rr
      WHERE rr.status = com.capstone.be.domain.enums.ReviewRequestStatus.PENDING
        AND rr.responseDeadline < :now
      """)
  List<ReviewRequest> findExpiredPendingRequests(@Param("now") Instant now);

  // Tìm tất cả ACCEPTED review requests có review deadline đã qua
  @Query("""
      SELECT rr FROM ReviewRequest rr
      WHERE rr.status = com.capstone.be.domain.enums.ReviewRequestStatus.ACCEPTED
        AND rr.reviewDeadline IS NOT NULL
        AND rr.reviewDeadline < :now
      """)
  List<ReviewRequest> findExpiredAcceptedRequests(@Param("now") Instant now);
}
