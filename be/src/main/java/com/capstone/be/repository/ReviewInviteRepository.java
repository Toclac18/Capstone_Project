package com.capstone.be.repository;

import com.capstone.be.domain.entity.ReviewInvite;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewInviteRepository extends JpaRepository<ReviewInvite, UUID> {

  @Query("SELECT ri FROM ReviewInvite ri " +
      "WHERE ri.document.id = :documentId " +
      "AND ri.status = 'SUCCESS' " +
      "ORDER BY ri.createdAt DESC")
  Optional<ReviewInvite> findSuccessfulReviewByDocumentId(@Param("documentId") UUID documentId);
}

