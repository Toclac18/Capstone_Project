package com.capstone.be.repository;

import com.capstone.be.domain.entity.Comment;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CommentRepository extends JpaRepository<Comment, UUID> {

  @Query("SELECT COUNT(c) FROM Comment c WHERE c.document.id = :documentId")
  Long countByDocumentId(@Param("documentId") UUID documentId);
}

