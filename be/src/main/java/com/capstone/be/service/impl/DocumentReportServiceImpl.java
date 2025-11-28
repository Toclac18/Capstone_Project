package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.DocumentReport;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.ReportReason;
import com.capstone.be.domain.enums.ReportStatus;
import com.capstone.be.dto.request.report.CreateReportRequest;
import com.capstone.be.dto.request.report.UpdateReportRequest;
import com.capstone.be.dto.response.report.ReportResponse;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.mapper.DocumentReportMapper;
import com.capstone.be.repository.DocumentReportRepository;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.repository.specification.DocumentReportSpecification;
import com.capstone.be.service.DocumentReportService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentReportServiceImpl implements DocumentReportService {

  private final DocumentReportRepository documentReportRepository;
  private final DocumentRepository documentRepository;
  private final UserRepository userRepository;
  private final DocumentReportMapper documentReportMapper;

  @Override
  @Transactional
  public ReportResponse createReport(CreateReportRequest request, UUID userId) {
    log.info("User {} creating report for document {}", userId, request.getDocumentId());

    // Validate document exists
    Document document = documentRepository.findById(request.getDocumentId())
        .orElseThrow(() -> ResourceNotFoundException.document(request.getDocumentId()));

    // Validate user exists
    User reporter = userRepository.findById(userId)
        .orElseThrow(() -> ResourceNotFoundException.user(userId));

    // Create report
    DocumentReport report = DocumentReport.builder()
        .document(document)
        .reporter(reporter)
        .reason(request.getReason())
        .description(request.getDescription())
        .status(ReportStatus.PENDING)
        .build();

    DocumentReport savedReport = documentReportRepository.save(report);

    log.info("Report created successfully: {}", savedReport.getId());

    return documentReportMapper.toResponse(savedReport);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<ReportResponse> getAllReports(ReportStatus status, ReportReason reason,
      UUID documentId, Pageable pageable) {
    log.info("Fetching all reports with filters - status: {}, reason: {}, documentId: {}",
        status, reason, documentId);

    Specification<DocumentReport> spec = DocumentReportSpecification.withFilters(
        status, reason, documentId, null);

    return documentReportRepository.findAll(spec, pageable)
        .map(documentReportMapper::toResponse);
  }

  @Override
  @Transactional(readOnly = true)
  public ReportResponse getReportById(UUID reportId) {
    log.info("Fetching report by ID: {}", reportId);

    DocumentReport report = documentReportRepository.findById(reportId)
        .orElseThrow(() -> new ResourceNotFoundException("Report", reportId));

    return documentReportMapper.toResponse(report);
  }

  @Override
  @Transactional
  public ReportResponse updateReport(UUID reportId, UpdateReportRequest request, UUID reviewerId) {
    log.info("BA {} updating report {}", reviewerId, reportId);

    // Validate report exists
    DocumentReport report = documentReportRepository.findById(reportId)
        .orElseThrow(() -> new ResourceNotFoundException("Report", reportId));

    // Validate reviewer exists
    User reviewer = userRepository.findById(reviewerId)
        .orElseThrow(() -> ResourceNotFoundException.user(reviewerId));

    // Update fields
    if (request.getStatus() != null) {
      report.setStatus(request.getStatus());
      log.info("Updated report {} status to: {}", reportId, request.getStatus());
    }

    if (request.getAdminNotes() != null) {
      report.setAdminNotes(request.getAdminNotes());
      log.info("Updated report {} admin notes", reportId);
    }

    // Set reviewer
    report.setReviewedBy(reviewer);

    DocumentReport updatedReport = documentReportRepository.save(report);

    log.info("Report updated successfully: {}", reportId);

    return documentReportMapper.toResponse(updatedReport);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<ReportResponse> getMyReports(UUID userId, Pageable pageable) {
    log.info("User {} fetching their reports", userId);

    return documentReportRepository.findByReporterId(userId, pageable)
        .map(documentReportMapper::toResponse);
  }
}
