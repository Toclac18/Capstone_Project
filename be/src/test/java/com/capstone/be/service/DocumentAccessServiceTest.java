package com.capstone.be.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.OrganizationProfile;
import com.capstone.be.domain.entity.ReviewRequest;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.DocVisibility;
import com.capstone.be.domain.enums.ReviewRequestStatus;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.DocumentRedemptionRepository;
import com.capstone.be.repository.OrgEnrollmentRepository;
import com.capstone.be.repository.ReviewRequestRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.service.impl.DocumentAccessServiceImpl;
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
@DisplayName("DocumentAccessService Unit Tests")
class DocumentAccessServiceTest {

  @Mock
  private DocumentRepository documentRepository;

  @Mock
  private DocumentRedemptionRepository documentRedemptionRepository;

  @Mock
  private OrgEnrollmentRepository orgEnrollmentRepository;

  @Mock
  private ReviewRequestRepository reviewRequestRepository;

  @Mock
  private UserRepository userRepository;

  @InjectMocks
  private DocumentAccessServiceImpl documentAccessService;

  private User user;
  private Document document;
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
        .visibility(DocVisibility.PUBLIC)
        .isPremium(false)
        .status(DocStatus.ACTIVE)
        .build();
  }

  // test hasAccess should return true for public non-premium document
  @Test
  @DisplayName("hasAccess should return true for public non-premium document")
  void hasAccess_ShouldReturnTrue_ForPublicNonPremium() {
    when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));

    boolean result = documentAccessService.hasAccess(userId, documentId);

    assertTrue(result);
  }

  // test hasAccess should return true when user is uploader
  @Test
  @DisplayName("hasAccess should return true when user is uploader")
  void hasAccess_ShouldReturnTrue_WhenUserIsUploader() {
    document.setUploader(user);
    document.setIsPremium(true);

    when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));

    boolean result = documentAccessService.hasAccess(userId, documentId);

    assertTrue(result);
  }

  // test hasAccess should return true when user has redeemed
  @Test
  @DisplayName("hasAccess should return true when user has redeemed")
  void hasAccess_ShouldReturnTrue_WhenUserHasRedeemed() {
    document.setIsPremium(true);
    document.setUploader(User.builder().id(UUID.randomUUID()).build());
    when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(documentRedemptionRepository.existsByReader_IdAndDocument_Id(userId, documentId))
        .thenReturn(true);

    boolean result = documentAccessService.hasAccess(userId, documentId);

    assertTrue(result);
  }

  // test hasAccess should return false for premium document without access
  @Test
  @DisplayName("hasAccess should return false for premium document without access")
  void hasAccess_ShouldReturnFalse_ForPremiumWithoutAccess() {
    document.setIsPremium(true);
    document.setUploader(User.builder().id(UUID.randomUUID()).build());
    when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(documentRedemptionRepository.existsByReader_IdAndDocument_Id(userId, documentId))
        .thenReturn(false);
    when(reviewRequestRepository.findByDocument_IdAndReviewer_Id(documentId, userId))
        .thenReturn(Optional.empty());

    boolean result = documentAccessService.hasAccess(userId, documentId);

    assertFalse(result);
  }

  // test hasAccess should return true when user is reviewer
  @Test
  @DisplayName("hasAccess should return true when user is reviewer")
  void hasAccess_ShouldReturnTrue_WhenUserIsReviewer() {
    document.setIsPremium(true);
    document.setUploader(User.builder().id(UUID.randomUUID()).build());
    ReviewRequest reviewRequest = ReviewRequest.builder()
        .reviewer(user)
        .document(document)
        .status(ReviewRequestStatus.ACCEPTED)
        .build();

    when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(documentRedemptionRepository.existsByReader_IdAndDocument_Id(userId, documentId))
        .thenReturn(false);
    when(reviewRequestRepository.findByDocument_IdAndReviewer_Id(documentId, userId))
        .thenReturn(Optional.of(reviewRequest));

    boolean result = documentAccessService.hasAccess(userId, documentId);

    assertTrue(result);
  }
}

