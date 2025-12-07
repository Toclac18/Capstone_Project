package com.capstone.be.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isA;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
import com.capstone.be.service.impl.DocumentReportServiceImpl;
import java.time.Instant;
import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

@ExtendWith(MockitoExtension.class)
@DisplayName("DocumentReportService Unit Tests")
class DocumentReportServiceTest {

  @Mock
  private DocumentReportRepository documentReportRepository;

  @Mock
  private DocumentRepository documentRepository;

  @Mock
  private UserRepository userRepository;

  @Mock
  private DocumentReportMapper documentReportMapper;

  @InjectMocks
  private DocumentReportServiceImpl documentReportService;

  private User user;
  private Document document;
  private DocumentReport report;
  private UUID userId;
  private UUID documentId;
  private UUID reportId;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    documentId = UUID.randomUUID();
    reportId = UUID.randomUUID();

    user = User.builder()
        .id(userId)
        .email("user@example.com")
        .fullName("Test User")
        .build();

    document = Document.builder()
        .id(documentId)
        .title("Test Document")
        .build();

    report = DocumentReport.builder()
        .id(reportId)
        .document(document)
        .reporter(user)
        .reason(ReportReason.INAPPROPRIATE_CONTENT)
        .description("Inappropriate content")
        .status(ReportStatus.PENDING)
        .createdAt(Instant.now())
        .updatedAt(Instant.now())
        .build();
  }

  // test createReport should create report successfully
  @Test
  @DisplayName("createReport should create report successfully")
  void createReport_ShouldCreateReport() {
    CreateReportRequest request = CreateReportRequest.builder()
        .documentId(documentId)
        .reason(ReportReason.INAPPROPRIATE_CONTENT)
        .description("Inappropriate content")
        .build();

    ReportResponse response = ReportResponse.builder()
        .id(reportId)
        .status(ReportStatus.PENDING)
        .build();

    when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(documentReportRepository.save(any(DocumentReport.class))).thenReturn(report);
    when(documentReportMapper.toResponse(report)).thenReturn(response);

    ReportResponse result = documentReportService.createReport(request, userId);

    assertNotNull(result);
    assertEquals(ReportStatus.PENDING, result.getStatus());
    verify(documentReportRepository, times(1)).save(any(DocumentReport.class));
  }

  // test createReport should throw exception when document not found
  @Test
  @DisplayName("createReport should throw exception when document not found")
  void createReport_ShouldThrowException_WhenDocumentNotFound() {
    CreateReportRequest request = CreateReportRequest.builder()
        .documentId(documentId)
        .reason(ReportReason.INAPPROPRIATE_CONTENT)
        .description("Inappropriate content")
        .build();

    when(documentRepository.findById(documentId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> documentReportService.createReport(request, userId));
    verify(documentReportRepository, never()).save(any());
  }

  // test createReport should throw exception when user not found
  @Test
  @DisplayName("createReport should throw exception when user not found")
  void createReport_ShouldThrowException_WhenUserNotFound() {
    CreateReportRequest request = CreateReportRequest.builder()
        .documentId(documentId)
        .reason(ReportReason.INAPPROPRIATE_CONTENT)
        .description("Inappropriate content")
        .build();

    when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
    when(userRepository.findById(userId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> documentReportService.createReport(request, userId));
    verify(documentReportRepository, never()).save(any());
  }

  // test getAllReports should return paginated reports
  @Test
  @DisplayName("getAllReports should return paginated reports")
  void getAllReports_ShouldReturnPaginatedReports() {
    Pageable pageable = PageRequest.of(0, 10);
    Page<DocumentReport> reportPage = new PageImpl<>(Arrays.asList(report), pageable, 1);

    ReportResponse response = ReportResponse.builder()
        .id(reportId)
        .status(ReportStatus.PENDING)
        .build();

    when(documentReportRepository.findAll(isA(Specification.class), eq(pageable)))
        .thenReturn(reportPage);
    when(documentReportMapper.toResponse(report)).thenReturn(response);

    Page<ReportResponse> result =
        documentReportService.getAllReports(ReportStatus.PENDING, null, null, pageable);

    assertEquals(1, result.getTotalElements());
    verify(documentReportRepository, times(1))
        .findAll(isA(Specification.class), eq(pageable));
  }

  // test getReportById should return report
  @Test
  @DisplayName("getReportById should return report")
  void getReportById_ShouldReturnReport() {
    ReportResponse response = ReportResponse.builder()
        .id(reportId)
        .status(ReportStatus.PENDING)
        .build();

    when(documentReportRepository.findById(reportId)).thenReturn(Optional.of(report));
    when(documentReportMapper.toResponse(report)).thenReturn(response);

    ReportResponse result = documentReportService.getReportById(reportId);

    assertNotNull(result);
    assertEquals(reportId, result.getId());
    verify(documentReportRepository, times(1)).findById(reportId);
  }

  // test getReportById should throw exception when not found
  @Test
  @DisplayName("getReportById should throw exception when not found")
  void getReportById_ShouldThrowException_WhenNotFound() {
    UUID nonExistentId = UUID.randomUUID();
    when(documentReportRepository.findById(nonExistentId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> documentReportService.getReportById(nonExistentId));
    verify(documentReportMapper, never()).toResponse(any());
  }

  // test updateReport should update report successfully
  @Test
  @DisplayName("updateReport should update report successfully")
  void updateReport_ShouldUpdateReport() {
    UUID reviewerId = UUID.randomUUID();
    User reviewer = User.builder().id(reviewerId).build();

    UpdateReportRequest request = UpdateReportRequest.builder()
        .status(ReportStatus.RESOLVED)
        .adminNotes("Issue resolved")
        .build();

    DocumentReport updatedReport = DocumentReport.builder()
        .id(reportId)
        .document(document)
        .reporter(user)
        .reviewedBy(reviewer)
        .status(ReportStatus.RESOLVED)
        .adminNotes("Issue resolved")
        .build();

    ReportResponse response = ReportResponse.builder()
        .id(reportId)
        .status(ReportStatus.RESOLVED)
        .adminNotes("Issue resolved")
        .build();

    when(documentReportRepository.findById(reportId)).thenReturn(Optional.of(report));
    when(userRepository.findById(reviewerId)).thenReturn(Optional.of(reviewer));
    when(documentReportRepository.save(any(DocumentReport.class))).thenReturn(updatedReport);
    when(documentReportMapper.toResponse(updatedReport)).thenReturn(response);

    ReportResponse result = documentReportService.updateReport(reportId, request, reviewerId);

    assertEquals(ReportStatus.RESOLVED, result.getStatus());
    assertEquals("Issue resolved", result.getAdminNotes());
    verify(documentReportRepository, times(1)).save(any(DocumentReport.class));
  }

  // test getMyReports should return user's reports
  @Test
  @DisplayName("getMyReports should return user's reports")
  void getMyReports_ShouldReturnUserReports() {
    Pageable pageable = PageRequest.of(0, 10);
    Page<DocumentReport> reportPage = new PageImpl<>(Arrays.asList(report), pageable, 1);

    ReportResponse response = ReportResponse.builder()
        .id(reportId)
        .status(ReportStatus.PENDING)
        .build();

    when(documentReportRepository.findByReporterId(userId, pageable)).thenReturn(reportPage);
    when(documentReportMapper.toResponse(report)).thenReturn(response);

    Page<ReportResponse> result = documentReportService.getMyReports(userId, pageable);

    assertEquals(1, result.getTotalElements());
    verify(documentReportRepository, times(1)).findByReporterId(userId, pageable);
  }
}


