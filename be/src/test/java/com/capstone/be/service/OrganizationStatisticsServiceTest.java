package com.capstone.be.service;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.capstone.be.domain.entity.Comment;
import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.DocumentReadHistory;
import com.capstone.be.domain.entity.DocumentRedemption;
import com.capstone.be.domain.entity.DocumentVote;
import com.capstone.be.domain.entity.OrgEnrollment;
import com.capstone.be.domain.entity.OrganizationProfile;
import com.capstone.be.domain.entity.SavedListDocument;
import com.capstone.be.domain.enums.OrgEnrollStatus;
import com.capstone.be.dto.response.statistics.OrganizationStatisticsResponse;
import com.capstone.be.repository.CommentRepository;
import com.capstone.be.repository.DocumentReadHistoryRepository;
import com.capstone.be.repository.DocumentRedemptionRepository;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.DocumentVoteRepository;
import com.capstone.be.repository.OrgEnrollmentRepository;
import com.capstone.be.repository.OrganizationProfileRepository;
import com.capstone.be.repository.SavedListDocumentRepository;
import com.capstone.be.service.impl.OrganizationStatisticsServiceImpl;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.Optional;
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
@DisplayName("OrganizationStatisticsService Unit Tests")
class OrganizationStatisticsServiceTest {

  @Mock
  private OrganizationProfileRepository organizationProfileRepository;

  @Mock
  private DocumentRepository documentRepository;

  @Mock
  private OrgEnrollmentRepository orgEnrollmentRepository;

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

  @InjectMocks
  private OrganizationStatisticsServiceImpl organizationStatisticsService;

  private UUID organizationId;
  private OrganizationProfile organization;
  private Document document;
  private Instant startDate;
  private Instant endDate;

  @BeforeEach
  void setUp() {
    organizationId = UUID.randomUUID();
    startDate = Instant.now().minusSeconds(86400);
    endDate = Instant.now();

    organization = OrganizationProfile.builder()
        .id(organizationId)
        .name("Test Organization")
        .type(com.capstone.be.domain.enums.OrgType.UNIVERSITY)
        .email("org@example.com")
        .createdAt(Instant.now())
        .build();

    com.capstone.be.domain.entity.User uploader = com.capstone.be.domain.entity.User.builder()
        .id(UUID.randomUUID())
        .email("uploader@example.com")
        .build();
    document = Document.builder()
        .id(UUID.randomUUID())
        .title("Test Document")
        .status(com.capstone.be.domain.enums.DocStatus.ACTIVE)
        .organization(organization)
        .createdAt(Instant.now())
        .viewCount(0)
        .upvoteCount(0)
        .voteScore(0)
        .uploader(uploader)
        .build();
  }

  // test getOrganizationStatistics should return statistics
  @Test
  @DisplayName("getOrganizationStatistics should return statistics")
  void getOrganizationStatistics_ShouldReturnStatistics() {
    List<Document> documents = Arrays.asList(document);
    List<OrgEnrollment> enrollments = Arrays.asList(
        OrgEnrollment.builder()
            .id(UUID.randomUUID())
            .organization(organization)
            .status(OrgEnrollStatus.JOINED)
            .createdAt(Instant.now())
            .build()
    );

    when(organizationProfileRepository.findById(organizationId))
        .thenReturn(Optional.of(organization));
    when(orgEnrollmentRepository.countByOrganizationAndStatus(organization, OrgEnrollStatus.JOINED))
        .thenReturn(10L);
    when(documentRepository.findAll(any(Specification.class))).thenReturn(documents);
    when(orgEnrollmentRepository.findAll(any(Specification.class))).thenReturn(enrollments);
    lenient().when(documentReadHistoryRepository.findAll(any(Specification.class))).thenReturn(Arrays.asList());
    lenient().when(documentVoteRepository.findAll(any(Specification.class))).thenReturn(Arrays.asList());
    lenient().when(commentRepository.findAll(any(Specification.class))).thenReturn(Arrays.asList());
    lenient().when(commentRepository.count(any(Specification.class))).thenReturn(0L);
    lenient().when(savedListDocumentRepository.findAll(any(Specification.class))).thenReturn(Arrays.asList());
    lenient().when(savedListDocumentRepository.count(any(Specification.class))).thenReturn(0L);
    lenient().when(documentRedemptionRepository.findAll(any(Specification.class))).thenReturn(Arrays.asList());
    lenient().when(documentRedemptionRepository.count(any(Specification.class))).thenReturn(0L);

    OrganizationStatisticsResponse result =
        organizationStatisticsService.getOrganizationStatistics(organizationId, startDate, endDate);

    assertNotNull(result);
    verify(organizationProfileRepository, times(1)).findById(organizationId);
  }

  // test getOrganizationStatistics should return statistics with null dates
  @Test
  @DisplayName("getOrganizationStatistics should return statistics with null dates")
  void getOrganizationStatistics_ShouldReturnStatistics_WithNullDates() {
    when(organizationProfileRepository.findById(organizationId))
        .thenReturn(Optional.of(organization));
    when(orgEnrollmentRepository.countByOrganizationAndStatus(organization, OrgEnrollStatus.JOINED))
        .thenReturn(10L);
    when(documentRepository.findAll(any(Specification.class))).thenReturn(Arrays.asList(document));
    lenient().when(orgEnrollmentRepository.findAll(any(Specification.class))).thenReturn(Arrays.asList());
    lenient().when(documentReadHistoryRepository.findAll(any(Specification.class))).thenReturn(Arrays.asList());
    lenient().when(documentVoteRepository.findAll(any(Specification.class))).thenReturn(Arrays.asList());
    lenient().when(commentRepository.findAll(any(Specification.class))).thenReturn(Arrays.asList());
    lenient().when(commentRepository.count(any(Specification.class))).thenReturn(0L);
    lenient().when(savedListDocumentRepository.findAll(any(Specification.class))).thenReturn(Arrays.asList());
    lenient().when(savedListDocumentRepository.count(any(Specification.class))).thenReturn(0L);
    lenient().when(documentRedemptionRepository.findAll(any(Specification.class))).thenReturn(Arrays.asList());
    lenient().when(documentRedemptionRepository.count(any(Specification.class))).thenReturn(0L);

    OrganizationStatisticsResponse result =
        organizationStatisticsService.getOrganizationStatistics(organizationId, null, null);

    assertNotNull(result);
    verify(organizationProfileRepository, times(1)).findById(organizationId);
  }
}

