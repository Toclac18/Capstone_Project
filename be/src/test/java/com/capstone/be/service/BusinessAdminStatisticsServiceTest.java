package com.capstone.be.service;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.capstone.be.domain.entity.Comment;
import com.capstone.be.domain.entity.DocType;
import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.DocumentReadHistory;
import com.capstone.be.domain.entity.DocumentRedemption;
import com.capstone.be.domain.entity.DocumentReport;
import com.capstone.be.domain.entity.DocumentVote;
import com.capstone.be.domain.entity.OrgEnrollment;
import com.capstone.be.domain.entity.OrganizationProfile;
import com.capstone.be.domain.entity.SavedListDocument;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.ReportStatus;
import com.capstone.be.dto.response.statistics.BusinessAdminDashboardResponse;
import com.capstone.be.dto.response.statistics.GlobalDocumentStatisticsResponse;
import com.capstone.be.dto.response.statistics.ReportHandlingStatisticsResponse;
import com.capstone.be.repository.CommentRepository;
import com.capstone.be.repository.DocTypeRepository;
import com.capstone.be.repository.DocumentReadHistoryRepository;
import com.capstone.be.repository.DocumentRedemptionRepository;
import com.capstone.be.repository.DocumentReportRepository;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.DocumentVoteRepository;
import com.capstone.be.repository.OrgEnrollmentRepository;
import com.capstone.be.repository.OrganizationProfileRepository;
import com.capstone.be.repository.SavedListDocumentRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.service.OrganizationStatisticsService;
import com.capstone.be.service.impl.BusinessAdminStatisticsServiceImpl;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;

@ExtendWith(MockitoExtension.class)
@DisplayName("BusinessAdminStatisticsService Unit Tests")
class BusinessAdminStatisticsServiceTest {

  @Mock
  private DocumentRepository documentRepository;

  @Mock
  private UserRepository userRepository;

  @Mock
  private OrganizationProfileRepository organizationProfileRepository;

  @Mock
  private DocumentReportRepository documentReportRepository;

  @Mock
  private OrganizationStatisticsService organizationStatisticsService;

  @Mock
  private DocumentReadHistoryRepository documentReadHistoryRepository;

  @Mock
  private DocumentVoteRepository documentVoteRepository;

  @Mock
  private CommentRepository commentRepository;

  @Mock
  private SavedListDocumentRepository savedListDocumentRepository;

  @Mock
  private DocumentRedemptionRepository documentRedemptionRepository;

  @Mock
  private OrgEnrollmentRepository orgEnrollmentRepository;

  @Mock
  private DocTypeRepository docTypeRepository;

  @InjectMocks
  private BusinessAdminStatisticsServiceImpl businessAdminStatisticsService;

  private Instant startDate;
  private Instant endDate;

  @BeforeEach
  void setUp() {
    startDate = Instant.now().minusSeconds(86400);
    endDate = Instant.now();
  }

  // test getDashboardOverview should return dashboard overview
  @Test
  @DisplayName("getDashboardOverview should return dashboard overview")
  void getDashboardOverview_ShouldReturnOverview() {
    when(documentRepository.count()).thenReturn(100L);
    when(documentRepository.count(any(Specification.class))).thenReturn(80L);
    when(userRepository.count()).thenReturn(50L);
    when(userRepository.count(any(Specification.class))).thenReturn(40L);
    when(organizationProfileRepository.count()).thenReturn(10L);
    when(documentReportRepository.countByStatus(ReportStatus.PENDING)).thenReturn(5L);
    when(documentRepository.findAll()).thenReturn(Arrays.asList());

    BusinessAdminDashboardResponse result = businessAdminStatisticsService.getDashboardOverview();

    assertNotNull(result);
    verify(documentRepository, times(1)).count();
  }

  // test getGlobalDocumentStatistics should return statistics
  @Test
  @DisplayName("getGlobalDocumentStatistics should return statistics")
  void getGlobalDocumentStatistics_ShouldReturnStatistics() {
    DocType docType = DocType.builder()
        .id(UUID.randomUUID())
        .name("Research Paper")
        .build();
    com.capstone.be.domain.entity.Domain domain = com.capstone.be.domain.entity.Domain.builder()
        .id(UUID.randomUUID())
        .name("Technology")
        .build();
    com.capstone.be.domain.entity.Specialization specialization = com.capstone.be.domain.entity.Specialization.builder()
        .id(UUID.randomUUID())
        .name("Computer Science")
        .domain(domain)
        .build();
    User uploader = User.builder()
        .id(UUID.randomUUID())
        .email("uploader@example.com")
        .build();
    Document doc = Document.builder()
        .id(UUID.randomUUID())
        .status(DocStatus.ACTIVE)
        .visibility(com.capstone.be.domain.enums.DocVisibility.PUBLIC)
        .isPremium(false)
        .viewCount(0)
        .upvoteCount(0)
        .voteScore(0)
        .createdAt(Instant.now())
        .docType(docType)
        .specialization(specialization)
        .uploader(uploader)
        .build();
    List<Document> documents = Arrays.asList(doc);

    when(documentRepository.findAll(any(Specification.class))).thenReturn(documents);
    lenient().when(documentReadHistoryRepository.findAll(any(Specification.class))).thenReturn(Arrays.asList());
    lenient().when(documentVoteRepository.findAll(any(Specification.class))).thenReturn(Arrays.asList());
    lenient().when(commentRepository.findAll(any(Specification.class))).thenReturn(Arrays.asList());
    lenient().when(commentRepository.count(any(Specification.class))).thenReturn(0L);
    lenient().when(savedListDocumentRepository.findAll(any(Specification.class))).thenReturn(Arrays.asList());
    lenient().when(savedListDocumentRepository.count(any(Specification.class))).thenReturn(0L);
    lenient().when(documentRedemptionRepository.findAll(any(Specification.class))).thenReturn(Arrays.asList());
    lenient().when(documentRedemptionRepository.count(any(Specification.class))).thenReturn(0L);
    lenient().when(orgEnrollmentRepository.findAll(any(Specification.class))).thenReturn(Arrays.asList());

    GlobalDocumentStatisticsResponse result =
        businessAdminStatisticsService.getGlobalDocumentStatistics(startDate, endDate);

    assertNotNull(result);
    verify(documentRepository, times(1)).findAll(any(Specification.class));
  }

  // test getReportHandlingStatistics should return statistics
  @Test
  @DisplayName("getReportHandlingStatistics should return statistics")
  void getReportHandlingStatistics_ShouldReturnStatistics() {
    DocumentReport report = DocumentReport.builder()
        .id(UUID.randomUUID())
        .status(ReportStatus.PENDING)
        .reason(com.capstone.be.domain.enums.ReportReason.INAPPROPRIATE_CONTENT)
        .createdAt(Instant.now())
        .updatedAt(Instant.now())
        .build();
    List<DocumentReport> reports = Arrays.asList(report);

    when(documentReportRepository.findAll(any(Specification.class))).thenReturn(reports);

    ReportHandlingStatisticsResponse result =
        businessAdminStatisticsService.getReportHandlingStatistics(startDate, endDate);

    assertNotNull(result);
    verify(documentReportRepository, times(1)).findAll(any(Specification.class));
  }

  // test getOrganizationStatistics should delegate to organizationStatisticsService
  @Test
  @DisplayName("getOrganizationStatistics should delegate to organizationStatisticsService")
  void getOrganizationStatistics_ShouldDelegate() {
    UUID organizationId = UUID.randomUUID();
    com.capstone.be.dto.response.statistics.OrganizationStatisticsResponse response =
        com.capstone.be.dto.response.statistics.OrganizationStatisticsResponse.builder()
            .build();

    when(organizationStatisticsService.getOrganizationStatistics(
        organizationId, startDate, endDate)).thenReturn(response);

    com.capstone.be.dto.response.statistics.OrganizationStatisticsResponse result =
        businessAdminStatisticsService.getOrganizationStatistics(organizationId, startDate, endDate);

    assertNotNull(result);
    verify(organizationStatisticsService, times(1))
        .getOrganizationStatistics(organizationId, startDate, endDate);
  }
}

