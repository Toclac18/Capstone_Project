package com.capstone.be.repository;

import com.capstone.be.domain.entity.DocumentViolation;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DocumentViolationRepository extends JpaRepository<DocumentViolation, UUID> {

  /**
   * Find all violations for a specific document
   */
  @Query("SELECT v FROM DocumentViolation v WHERE v.document.id = :documentId ORDER BY v.page ASC, v.createdAt ASC")
  List<DocumentViolation> findByDocumentId(@Param("documentId") UUID documentId);

  /**
   * Count violations for a document
   */
  @Query("SELECT COUNT(v) FROM DocumentViolation v WHERE v.document.id = :documentId")
  long countByDocumentId(@Param("documentId") UUID documentId);

  /**
   * Delete all violations for a document
   */
  void deleteByDocument_Id(UUID documentId);
}
