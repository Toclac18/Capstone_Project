package com.capstone.be.repository;

import com.capstone.be.domain.entity.SavedDocument;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SavedDocumentRepository extends JpaRepository<SavedDocument, UUID> {

  @Query("SELECT COUNT(sd) FROM SavedDocument sd WHERE sd.document.id = :documentId")
  Long countByDocumentId(@Param("documentId") UUID documentId);
}

