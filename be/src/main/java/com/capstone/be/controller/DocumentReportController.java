package com.capstone.be.controller;

import com.capstone.be.domain.enums.ReportReason;
import com.capstone.be.domain.enums.ReportStatus;
import com.capstone.be.dto.common.PagedResponse;
import com.capstone.be.dto.request.report.CreateReportRequest;
import com.capstone.be.dto.request.report.UpdateReportRequest;
import com.capstone.be.dto.response.report.ReportResponse;
import com.capstone.be.security.model.UserPrincipal;
import com.capstone.be.service.DocumentReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for document report operations
 */
@Slf4j
@RestController
@RequestMapping("/reports")
@RequiredArgsConstructor
@Tag(name = "Document Reports", description = "APIs for document report management")
public class DocumentReportController {

  private final DocumentReportService documentReportService;

  /**
   * Create a report for a document POST /api/reports
   *
   * @param request       Report creation request
   * @param userPrincipal Authenticated user (reporter)
   * @return Created report response
   */
  @PostMapping
  @PreAuthorize("isAuthenticated()")
  @Operation(summary = "Report a document",
      description = "Submit a report for inappropriate content or issues in a document")
  public ResponseEntity<ReportResponse> createReport(
      @Valid @RequestBody CreateReportRequest request,
      @AuthenticationPrincipal UserPrincipal userPrincipal) {

    UUID userId = userPrincipal.getId();
    log.info("User {} creating report for document {}", userId, request.getDocumentId());

    ReportResponse response = documentReportService.createReport(request, userId);

    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  /**
   * Get all reports (BA only) GET /api/reports
   *
   * @param status     Optional status filter
   * @param reason     Optional reason filter
   * @param documentId Optional document filter
   * @param pageable   Pagination parameters
   * @return Page of reports
   */
  @GetMapping("")
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  @Operation(summary = "Get all reports (BA only)",
      description = "Get all document reports with optional filters")
  public ResponseEntity<PagedResponse<ReportResponse>> getAllReports(
      @RequestParam(name = "status", required = false) ReportStatus status,
      @RequestParam(name = "reason", required = false) ReportReason reason,
      @RequestParam(name = "documentId", required = false) UUID documentId,
      @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

    log.info("BA fetching reports - status: {}, reason: {}, documentId: {}, page: {}, size: {}",
        status, reason, documentId, pageable.getPageNumber(), pageable.getPageSize());

    Page<ReportResponse> reports = documentReportService.getAllReports(
        status, reason, documentId, pageable);

    return ResponseEntity.ok(PagedResponse.of(reports));
  }

  /**
   * Get report by ID (BA only) GET /api/reports/{reportId}
   *
   * @param reportId Report ID
   * @return Report details
   */
  @GetMapping("/{reportId}")
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  @Operation(summary = "Get report details (BA only)",
      description = "Get detailed information about a specific report")
  public ResponseEntity<ReportResponse> getReportById(
      @PathVariable(name = "reportId") UUID reportId) {

    log.info("BA fetching report details: {}", reportId);

    ReportResponse response = documentReportService.getReportById(reportId);

    return ResponseEntity.ok(response);
  }

  /**
   * Update report (BA only) PUT /api/reports/{reportId}
   *
   * @param reportId      Report ID
   * @param request       Update request
   * @param userPrincipal Authenticated BA user
   * @return Updated report response
   */
  @PutMapping("{reportId}")
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  @Operation(summary = "Update report (BA only)",
      description = "Update report status and add admin notes")
  public ResponseEntity<ReportResponse> updateReport(
      @PathVariable(name = "reportId") UUID reportId,
      @Valid @RequestBody UpdateReportRequest request,
      @AuthenticationPrincipal UserPrincipal userPrincipal) {

    UUID reviewerId = userPrincipal.getId();
    log.info("BA {} updating report {}", reviewerId, reportId);

    ReportResponse response = documentReportService.updateReport(reportId, request, reviewerId);

    return ResponseEntity.ok(response);
  }

  /**
   * Get current user's reports GET /api/reports/my-reports
   *
   * @param userPrincipal Authenticated user
   * @param pageable      Pagination parameters
   * @return Page of user's reports
   */
  @GetMapping("/my-reports")
  @PreAuthorize("isAuthenticated()")
  @Operation(summary = "Get my reports",
      description = "Get all reports submitted by the current user")
  public ResponseEntity<PagedResponse<ReportResponse>> getMyReports(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

    UUID userId = userPrincipal.getId();
    log.info("User {} fetching their reports", userId);

    Page<ReportResponse> reports = documentReportService.getMyReports(userId, pageable);

    return ResponseEntity.ok(PagedResponse.of(reports));
  }
}
