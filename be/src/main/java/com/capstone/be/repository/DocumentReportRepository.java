package com.capstone.be.repository;

import com.capstone.be.domain.entity.DocumentReport;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DocumentReportRepository extends JpaRepository<DocumentReport, UUID> {

  @Query("SELECT COUNT(dr) FROM DocumentReport dr WHERE dr.document.id = :documentId")
  Long countByDocumentId(@Param("documentId") UUID documentId);
}

