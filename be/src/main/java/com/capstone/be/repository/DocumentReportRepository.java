package com.capstone.be.repository;

import com.capstone.be.domain.entity.DocumentReport;
import com.capstone.be.domain.enums.ReportStatus;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DocumentReportRepository extends JpaRepository<DocumentReport, UUID>,
    JpaSpecificationExecutor<DocumentReport> {

  /**
   * Find all reports with pagination
   */
  Page<DocumentReport> findAll(Pageable pageable);

  /**
   * Find reports by status
   */
  Page<DocumentReport> findByStatus(ReportStatus status, Pageable pageable);

  /**
   * Find reports by document
   */
  @Query("SELECT r FROM DocumentReport r WHERE r.document.id = :documentId")
  Page<DocumentReport> findByDocumentId(@Param("documentId") UUID documentId, Pageable pageable);

  /**
   * Find reports by reporter
   */
  @Query("SELECT r FROM DocumentReport r WHERE r.reporter.id = :reporterId")
  Page<DocumentReport> findByReporterId(@Param("reporterId") UUID reporterId, Pageable pageable);

  /**
   * Count pending reports
   */
  long countByStatus(ReportStatus status);
}
