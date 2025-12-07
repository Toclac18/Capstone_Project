package com.capstone.be.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.DocumentVote;
import com.capstone.be.domain.entity.User;
import com.capstone.be.dto.request.document.VoteDocumentRequest;
import com.capstone.be.dto.response.document.VoteDocumentResponse;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.DocumentVoteRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.service.impl.DocumentVoteServiceImpl;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("DocumentVoteService Unit Tests")
class DocumentVoteServiceTest {

  @Mock
  private DocumentVoteRepository documentVoteRepository;

  @Mock
  private DocumentRepository documentRepository;

  @Mock
  private UserRepository userRepository;

  @InjectMocks
  private DocumentVoteServiceImpl documentVoteService;

  private User user;
  private Document document;
  private DocumentVote vote;
  private UUID userId;
  private UUID documentId;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    documentId = UUID.randomUUID();

    user = User.builder()
        .id(userId)
        .email("user@example.com")
        .fullName("Test User")
        .build();

    document = Document.builder()
        .id(documentId)
        .title("Test Document")
        .voteScore(0)
        .upvoteCount(0)
        .build();

    vote = DocumentVote.builder()
        .id(UUID.randomUUID())
        .document(document)
        .user(user)
        .voteValue(1)
        .build();
  }

  // test voteDocument should create new vote
  @Test
  @DisplayName("voteDocument should create new vote")
  void voteDocument_ShouldCreateNewVote() {
    VoteDocumentRequest request = VoteDocumentRequest.builder()
        .voteValue(1)
        .build();

    DocumentVote newVote = DocumentVote.builder()
        .id(UUID.randomUUID())
        .document(document)
        .user(user)
        .voteValue(1)
        .build();

    when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(documentVoteRepository.findByDocumentIdAndUserId(documentId, userId))
        .thenReturn(Optional.empty());
    when(documentVoteRepository.save(any(DocumentVote.class))).thenReturn(newVote);
    when(documentRepository.save(any(Document.class))).thenReturn(document);

    VoteDocumentResponse result = documentVoteService.voteDocument(userId, documentId, request);

    assertNotNull(result);
    verify(documentVoteRepository, times(1)).save(any(DocumentVote.class));
    verify(documentRepository, times(1)).save(any(Document.class));
  }

  // test voteDocument should update existing vote
  @Test
  @DisplayName("voteDocument should update existing vote")
  void voteDocument_ShouldUpdateExistingVote() {
    VoteDocumentRequest request = VoteDocumentRequest.builder()
        .voteValue(-1)
        .build();

    document.setVoteScore(1);
    document.setUpvoteCount(1);

    when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(documentVoteRepository.findByDocumentIdAndUserId(documentId, userId))
        .thenReturn(Optional.of(vote));
    when(documentVoteRepository.save(any(DocumentVote.class))).thenReturn(vote);
    when(documentRepository.save(any(Document.class))).thenReturn(document);

    VoteDocumentResponse result = documentVoteService.voteDocument(userId, documentId, request);

    assertNotNull(result);
    verify(documentVoteRepository, times(1)).save(any(DocumentVote.class));
  }

  // test voteDocument should throw exception when document not found
  @Test
  @DisplayName("voteDocument should throw exception when document not found")
  void voteDocument_ShouldThrowException_WhenDocumentNotFound() {
    VoteDocumentRequest request = VoteDocumentRequest.builder()
        .voteValue(1)
        .build();

    when(documentRepository.findById(documentId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> documentVoteService.voteDocument(userId, documentId, request));
    verify(documentVoteRepository, never()).save(any());
  }

  // test getUserVote should return user vote
  @Test
  @DisplayName("getUserVote should return user vote")
  void getUserVote_ShouldReturnUserVote() {
    when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
    when(documentVoteRepository.findByDocumentIdAndUserId(documentId, userId))
        .thenReturn(Optional.of(vote));

    VoteDocumentResponse result = documentVoteService.getUserVote(documentId, userId);

    assertNotNull(result);
    assertEquals(1, result.getUserVote());
  }

  // test getUserVote should throw exception when document not found
  @Test
  @DisplayName("getUserVote should throw exception when document not found")
  void getUserVote_ShouldThrowException_WhenDocumentNotFound() {
    when(documentRepository.findById(documentId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> documentVoteService.getUserVote(documentId, userId));
  }

  // test getUserVote should throw exception when vote not found
  @Test
  @DisplayName("getUserVote should throw exception when vote not found")
  void getUserVote_ShouldThrowException_WhenVoteNotFound() {
    when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
    when(documentVoteRepository.findByDocumentIdAndUserId(documentId, userId))
        .thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> documentVoteService.getUserVote(documentId, userId));
  }
}

