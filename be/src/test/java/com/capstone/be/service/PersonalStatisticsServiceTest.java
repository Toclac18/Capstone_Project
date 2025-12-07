package com.capstone.be.service;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.DocumentReadHistory;
import com.capstone.be.domain.entity.DocumentRedemption;
import com.capstone.be.domain.entity.DocumentVote;
import com.capstone.be.domain.entity.Comment;
import com.capstone.be.domain.entity.SavedListDocument;
import com.capstone.be.dto.response.statistics.PersonalDocumentStatisticsResponse;
import com.capstone.be.repository.CommentRepository;
import com.capstone.be.repository.DocumentReadHistoryRepository;
import com.capstone.be.repository.DocumentRedemptionRepository;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.DocumentVoteRepository;
import com.capstone.be.repository.SavedListDocumentRepository;
import com.capstone.be.service.impl.PersonalStatisticsServiceImpl;
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
@DisplayName("PersonalStatisticsService Unit Tests")
class PersonalStatisticsServiceTest {

  @Mock
  private DocumentRepository documentRepository;

  @Mock
  private DocumentRedemptionRepository documentRedemptionRepository;

  @Mock
  private DocumentReadHistoryRepository documentReadHistoryRepository;

  @Mock
  private DocumentVoteRepository documentVoteRepository;

  @Mock
  private CommentRepository commentRepository;

  @Mock
  private SavedListDocumentRepository savedListDocumentRepository;

  @InjectMocks
  private PersonalStatisticsServiceImpl personalStatisticsService;

  private UUID userId;
  private Document document;
  private Instant startDate;
  private Instant endDate;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    startDate = Instant.now().minusSeconds(86400);
    endDate = Instant.now();

    document = Document.builder()
        .id(UUID.randomUUID())
        .title("Test Document")
        .status(com.capstone.be.domain.enums.DocStatus.ACTIVE)
        .createdAt(Instant.now())
        .viewCount(0)
        .upvoteCount(0)
        .voteScore(0)
        .build();
  }

  // test getPersonalDocumentStatistics should return statistics
  @Test
  @DisplayName("getPersonalDocumentStatistics should return statistics")
  void getPersonalDocumentStatistics_ShouldReturnStatistics() {
    List<Document> uploadedDocs = Arrays.asList(document);
    List<DocumentRedemption> redemptions = Arrays.asList(
        DocumentRedemption.builder()
            .id(UUID.randomUUID())
            .document(document)
            .build()
    );
    List<DocumentReadHistory> readHistory = Arrays.asList(
        DocumentReadHistory.builder()
            .id(UUID.randomUUID())
            .document(document)
            .createdAt(Instant.now())
            .build()
    );

    when(documentRepository.findAll(any(Specification.class))).thenReturn(uploadedDocs);
    when(documentVoteRepository.findAll(any(Specification.class))).thenReturn(Arrays.asList());
    when(commentRepository.findAll(any(Specification.class))).thenReturn(Arrays.asList());
    when(commentRepository.count(any(Specification.class))).thenReturn(0L);
    when(savedListDocumentRepository.findAll(any(Specification.class))).thenReturn(Arrays.asList());
    when(savedListDocumentRepository.count(any(Specification.class))).thenReturn(0L);
    when(documentRedemptionRepository.count(any(Specification.class))).thenReturn(0L);
    when(documentReadHistoryRepository.findAll(any(Specification.class))).thenReturn(readHistory);

    PersonalDocumentStatisticsResponse result =
        personalStatisticsService.getPersonalDocumentStatistics(userId, startDate, endDate);

    assertNotNull(result);
    verify(documentRepository, times(1)).findAll(any(Specification.class));
  }

  // test getPersonalDocumentStatistics should return statistics with null dates
  @Test
  @DisplayName("getPersonalDocumentStatistics should return statistics with null dates")
  void getPersonalDocumentStatistics_ShouldReturnStatistics_WithNullDates() {
    when(documentRepository.findAll(any(Specification.class))).thenReturn(Arrays.asList(document));
    when(documentVoteRepository.findAll(any(Specification.class))).thenReturn(Arrays.asList());
    when(commentRepository.findAll(any(Specification.class))).thenReturn(Arrays.asList());
    when(commentRepository.count(any(Specification.class))).thenReturn(0L);
    when(savedListDocumentRepository.findAll(any(Specification.class))).thenReturn(Arrays.asList());
    when(savedListDocumentRepository.count(any(Specification.class))).thenReturn(0L);
    when(documentRedemptionRepository.count(any(Specification.class))).thenReturn(0L);
    when(documentReadHistoryRepository.findAll(any(Specification.class))).thenReturn(Arrays.asList(
        DocumentReadHistory.builder()
            .id(UUID.randomUUID())
            .document(document)
            .createdAt(Instant.now())
            .build()
    ));

    PersonalDocumentStatisticsResponse result =
        personalStatisticsService.getPersonalDocumentStatistics(userId, null, null);

    assertNotNull(result);
    verify(documentRepository, times(1)).findAll(any(Specification.class));
  }
}

