package com.capstone.be.repository;

import com.capstone.be.domain.entity.Vote;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface VoteRepository extends JpaRepository<Vote, UUID> {

  @Query("SELECT COUNT(v) FROM Vote v WHERE v.document.id = :documentId AND v.isUpvote = true")
  Long countUpvotesByDocumentId(@Param("documentId") UUID documentId);

  @Query("SELECT COUNT(v) FROM Vote v WHERE v.document.id = :documentId AND v.isUpvote = false")
  Long countDownvotesByDocumentId(@Param("documentId") UUID documentId);
}

