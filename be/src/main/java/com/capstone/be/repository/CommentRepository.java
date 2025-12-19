package com.capstone.be.repository;

import com.capstone.be.domain.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface CommentRepository extends JpaRepository<Comment, UUID>,
        JpaSpecificationExecutor<Comment> {

    @Query("SELECT c FROM Comment c WHERE c.document.id = :documentId AND c.isDeleted = false")
    Page<Comment> findByDocumentIdAndNotDeleted(@Param("documentId") UUID documentId, Pageable pageable);

    @Query("SELECT c FROM Comment c WHERE c.id = :id AND c.isDeleted = false")
    Optional<Comment> findByIdAndNotDeleted(@Param("id") UUID id);

    @Query("SELECT COUNT(c) FROM Comment c WHERE c.document.id = :documentId AND c.isDeleted = false")
    long countByDocumentIdAndNotDeleted(@Param("documentId") UUID documentId);
}
