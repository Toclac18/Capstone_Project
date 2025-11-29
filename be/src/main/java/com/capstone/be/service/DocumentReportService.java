package com.capstone.be.service;

import com.capstone.be.domain.enums.ReportReason;
import com.capstone.be.domain.enums.ReportStatus;
import com.capstone.be.dto.request.report.CreateReportRequest;
import com.capstone.be.dto.request.report.UpdateReportRequest;
import com.capstone.be.dto.response.report.ReportResponse;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface DocumentReportService {

  /**
   * Create a report for a document
   *
   * @param request Report creation request
   * @param userId  Reporter user ID
   * @return Created report response
   */
  ReportResponse createReport(CreateReportRequest request, UUID userId);

  /**
   * Get all reports with filters (BA only)
   *
   * @param status     Optional status filter
   * @param reason     Optional reason filter
   * @param documentId Optional document filter
   * @param pageable   Pagination parameters
   * @return Page of reports
   */
  Page<ReportResponse> getAllReports(ReportStatus status, ReportReason reason,
      UUID documentId, Pageable pageable);

  /**
   * Get report by ID (BA only)
   *
   * @param reportId Report ID
   * @return Report details
   */
  ReportResponse getReportById(UUID reportId);

  /**
   * Update report status and notes (BA only)
   *
   * @param reportId   Report ID
   * @param request    Update request
   * @param reviewerId Business Admin user ID
   * @return Updated report response
   */
  ReportResponse updateReport(UUID reportId, UpdateReportRequest request, UUID reviewerId);

  /**
   * Get user's own reports
   *
   * @param userId   User ID
   * @param pageable Pagination parameters
   * @return Page of user's reports
   */
  Page<ReportResponse> getMyReports(UUID userId, Pageable pageable);
}
