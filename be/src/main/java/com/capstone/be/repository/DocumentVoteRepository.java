package com.capstone.be.repository;

import com.capstone.be.domain.entity.DocumentVote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DocumentVoteRepository extends JpaRepository<DocumentVote, UUID> {

    /**
     * Find existing vote by document and user
     */
    @Query("SELECT v FROM DocumentVote v WHERE v.document.id = :documentId AND v.user.id = :userId")
    Optional<DocumentVote> findByDocumentIdAndUserId(@Param("documentId") UUID documentId,
                                                      @Param("userId") UUID userId);

    /**
     * Count upvotes for a document
     */
    @Query("SELECT COUNT(v) FROM DocumentVote v WHERE v.document.id = :documentId AND v.voteValue = 1")
    long countUpvotesByDocumentId(@Param("documentId") UUID documentId);

    /**
     * Count downvotes for a document
     */
    @Query("SELECT COUNT(v) FROM DocumentVote v WHERE v.document.id = :documentId AND v.voteValue = -1")
    long countDownvotesByDocumentId(@Param("documentId") UUID documentId);

    /**
     * Calculate vote score (upvotes - downvotes) for a document
     */
    @Query("SELECT COALESCE(SUM(v.voteValue), 0) FROM DocumentVote v WHERE v.document.id = :documentId")
    int calculateVoteScore(@Param("documentId") UUID documentId);

    /**
     * Delete vote record (used when vote value becomes 0)
     */
    @Modifying
    @Query("DELETE FROM DocumentVote v WHERE v.document.id = :documentId AND v.user.id = :userId")
    void deleteByDocumentIdAndUserId(@Param("documentId") UUID documentId, @Param("userId") UUID userId);
}
