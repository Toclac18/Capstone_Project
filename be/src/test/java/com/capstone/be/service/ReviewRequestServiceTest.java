package com.capstone.be.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.DocumentReview;
import com.capstone.be.domain.entity.ReviewRequest;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.ReviewDecision;
import com.capstone.be.domain.enums.ReviewRequestStatus;
import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.dto.request.review.AssignReviewerRequest;
import com.capstone.be.dto.request.review.RespondReviewRequestRequest;
import com.capstone.be.dto.request.review.SubmitReviewRequest;
import com.capstone.be.dto.response.review.DocumentReviewResponse;
import com.capstone.be.dto.response.review.ReviewRequestResponse;
import com.capstone.be.exception.InvalidRequestException;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.mapper.DocumentReviewMapper;
import com.capstone.be.mapper.ReviewRequestMapper;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.DocumentReviewRepository;
import com.capstone.be.repository.ReviewRequestRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.service.impl.ReviewRequestServiceImpl;
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

@ExtendWith(MockitoExtension.class)
@DisplayName("ReviewRequestService Unit Tests")
class ReviewRequestServiceTest {

  @Mock
  private ReviewRequestRepository reviewRequestRepository;

  @Mock
  private DocumentRepository documentRepository;

  @Mock
  private UserRepository userRepository;

  @Mock
  private DocumentReviewRepository documentReviewRepository;

  @Mock
  private ReviewRequestMapper reviewRequestMapper;

  @Mock
  private DocumentReviewMapper documentReviewMapper;

  @InjectMocks
  private ReviewRequestServiceImpl reviewRequestService;

  private User businessAdmin;
  private User reviewer;
  private Document document;
  private ReviewRequest reviewRequest;
  private UUID businessAdminId;
  private UUID reviewerId;
  private UUID documentId;
  private UUID reviewRequestId;

  @BeforeEach
  void setUp() {
    businessAdminId = UUID.randomUUID();
    reviewerId = UUID.randomUUID();
    documentId = UUID.randomUUID();
    reviewRequestId = UUID.randomUUID();

    businessAdmin = User.builder()
        .id(businessAdminId)
        .email("admin@example.com")
        .fullName("Business Admin")
        .role(UserRole.BUSINESS_ADMIN)
        .build();

    reviewer = User.builder()
        .id(reviewerId)
        .email("reviewer@example.com")
        .fullName("Reviewer")
        .role(UserRole.REVIEWER)
        .build();

    document = Document.builder()
        .id(documentId)
        .title("Test Document")
        .status(DocStatus.AI_VERIFIED)
        .isPremium(true)
        .build();

    reviewRequest = ReviewRequest.builder()
        .id(reviewRequestId)
        .document(document)
        .reviewer(reviewer)
        .assignedBy(businessAdmin)
        .status(ReviewRequestStatus.PENDING)
        .responseDeadline(Instant.now().plusSeconds(86400))
        .createdAt(Instant.now())
        .updatedAt(Instant.now())
        .build();
  }

  // test assignReviewer should assign reviewer successfully
  @Test
  @DisplayName("assignReviewer should assign reviewer successfully")
  void assignReviewer_ShouldAssignReviewer() {
    AssignReviewerRequest request = AssignReviewerRequest.builder()
        .reviewerId(reviewerId)
        .note("Please review this document")
        .build();

    ReviewRequest newReviewRequest = ReviewRequest.builder()
        .id(reviewRequestId)
        .document(document)
        .reviewer(reviewer)
        .assignedBy(businessAdmin)
        .status(ReviewRequestStatus.PENDING)
        .build();

    ReviewRequestResponse response = ReviewRequestResponse.builder()
        .id(reviewRequestId)
        .status(ReviewRequestStatus.PENDING)
        .build();

    when(userRepository.findById(businessAdminId)).thenReturn(Optional.of(businessAdmin));
    when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
    when(userRepository.findById(reviewerId)).thenReturn(Optional.of(reviewer));
    when(reviewRequestRepository.existsByDocument_IdAndReviewer_Id(documentId, reviewerId))
        .thenReturn(false);
    when(reviewRequestRepository.save(any(ReviewRequest.class))).thenReturn(newReviewRequest);
    when(reviewRequestMapper.toResponse(newReviewRequest)).thenReturn(response);

    ReviewRequestResponse result =
        reviewRequestService.assignReviewer(businessAdminId, documentId, request);

    assertNotNull(result);
    assertEquals(ReviewRequestStatus.PENDING, result.getStatus());
    verify(reviewRequestRepository, times(1)).save(any(ReviewRequest.class));
  }

  // test assignReviewer should throw exception when not business admin
  @Test
  @DisplayName("assignReviewer should throw exception when not business admin")
  void assignReviewer_ShouldThrowException_WhenNotBusinessAdmin() {
    User regularUser = User.builder()
        .id(UUID.randomUUID())
        .role(UserRole.READER)
        .build();

    AssignReviewerRequest request = AssignReviewerRequest.builder()
        .reviewerId(reviewerId)
        .build();

    when(userRepository.findById(regularUser.getId())).thenReturn(Optional.of(regularUser));

    assertThrows(InvalidRequestException.class,
        () -> reviewRequestService.assignReviewer(regularUser.getId(), documentId, request));
    verify(reviewRequestRepository, never()).save(any());
  }

  // test assignReviewer should throw exception when document not premium
  @Test
  @DisplayName("assignReviewer should throw exception when document not premium")
  void assignReviewer_ShouldThrowException_WhenDocumentNotPremium() {
    Document nonPremiumDoc = Document.builder()
        .id(documentId)
        .title("Test Document")
        .status(DocStatus.AI_VERIFIED)
        .isPremium(false)
        .build();

    AssignReviewerRequest request = AssignReviewerRequest.builder()
        .reviewerId(reviewerId)
        .build();

    when(userRepository.findById(businessAdminId)).thenReturn(Optional.of(businessAdmin));
    when(documentRepository.findById(documentId)).thenReturn(Optional.of(nonPremiumDoc));

    assertThrows(InvalidRequestException.class,
        () -> reviewRequestService.assignReviewer(businessAdminId, documentId, request));
    verify(reviewRequestRepository, never()).save(any());
  }

  // test assignReviewer should throw exception when document not AI_VERIFIED
  @Test
  @DisplayName("assignReviewer should throw exception when document not AI_VERIFIED")
  void assignReviewer_ShouldThrowException_WhenDocumentNotAIVerified() {
    Document doc = Document.builder()
        .id(documentId)
        .title("Test Document")
        .status(DocStatus.AI_VERIFYING)
        .isPremium(true)
        .build();

    AssignReviewerRequest request = AssignReviewerRequest.builder()
        .reviewerId(reviewerId)
        .build();

    when(userRepository.findById(businessAdminId)).thenReturn(Optional.of(businessAdmin));
    when(documentRepository.findById(documentId)).thenReturn(Optional.of(doc));

    assertThrows(InvalidRequestException.class,
        () -> reviewRequestService.assignReviewer(businessAdminId, documentId, request));
    verify(reviewRequestRepository, never()).save(any());
  }

  // test assignReviewer should throw exception when reviewer already assigned
  @Test
  @DisplayName("assignReviewer should throw exception when reviewer already assigned")
  void assignReviewer_ShouldThrowException_WhenReviewerAlreadyAssigned() {
    AssignReviewerRequest request = AssignReviewerRequest.builder()
        .reviewerId(reviewerId)
        .build();

    when(userRepository.findById(businessAdminId)).thenReturn(Optional.of(businessAdmin));
    when(documentRepository.findById(documentId)).thenReturn(Optional.of(document));
    when(userRepository.findById(reviewerId)).thenReturn(Optional.of(reviewer));
    when(reviewRequestRepository.existsByDocument_IdAndReviewer_Id(documentId, reviewerId))
        .thenReturn(true);

    assertThrows(InvalidRequestException.class,
        () -> reviewRequestService.assignReviewer(businessAdminId, documentId, request));
    verify(reviewRequestRepository, never()).save(any());
  }

  // test getReviewerPendingRequests should return pending requests
  @Test
  @DisplayName("getReviewerPendingRequests should return pending requests")
  void getReviewerPendingRequests_ShouldReturnPendingRequests() {
    Pageable pageable = PageRequest.of(0, 10);
    Page<ReviewRequest> requestPage = new PageImpl<>(Arrays.asList(reviewRequest), pageable, 1);

    ReviewRequestResponse response = ReviewRequestResponse.builder()
        .id(reviewRequestId)
        .status(ReviewRequestStatus.PENDING)
        .build();

    when(userRepository.findById(reviewerId)).thenReturn(Optional.of(reviewer));
    when(reviewRequestRepository.findByReviewer_IdAndStatus(
        reviewerId, ReviewRequestStatus.PENDING, pageable)).thenReturn(requestPage);
    when(reviewRequestMapper.toResponse(reviewRequest)).thenReturn(response);

    Page<ReviewRequestResponse> result =
        reviewRequestService.getReviewerPendingRequests(reviewerId, pageable);

    assertEquals(1, result.getTotalElements());
    verify(reviewRequestRepository, times(1))
        .findByReviewer_IdAndStatus(reviewerId, ReviewRequestStatus.PENDING, pageable);
  }

  // test getReviewerAllRequests should return all requests
  @Test
  @DisplayName("getReviewerAllRequests should return all requests")
  void getReviewerAllRequests_ShouldReturnAllRequests() {
    Pageable pageable = PageRequest.of(0, 10);
    Page<ReviewRequest> requestPage = new PageImpl<>(Arrays.asList(reviewRequest), pageable, 1);

    ReviewRequestResponse response = ReviewRequestResponse.builder()
        .id(reviewRequestId)
        .status(ReviewRequestStatus.PENDING)
        .build();

    when(userRepository.findById(reviewerId)).thenReturn(Optional.of(reviewer));
    when(reviewRequestRepository.findByReviewer_Id(reviewerId, pageable))
        .thenReturn(requestPage);
    when(reviewRequestMapper.toResponse(reviewRequest)).thenReturn(response);

    Page<ReviewRequestResponse> result =
        reviewRequestService.getReviewerAllRequests(reviewerId, pageable);

    assertEquals(1, result.getTotalElements());
  }

  // test respondToReviewRequest should accept request
  @Test
  @DisplayName("respondToReviewRequest should accept request")
  void respondToReviewRequest_ShouldAcceptRequest() {
    RespondReviewRequestRequest request = RespondReviewRequestRequest.builder()
        .accept(true)
        .build();

    ReviewRequest acceptedRequest = ReviewRequest.builder()
        .id(reviewRequestId)
        .document(document)
        .reviewer(reviewer)
        .status(ReviewRequestStatus.ACCEPTED)
        .build();

    ReviewRequestResponse response = ReviewRequestResponse.builder()
        .id(reviewRequestId)
        .status(ReviewRequestStatus.ACCEPTED)
        .build();

    when(userRepository.findById(reviewerId)).thenReturn(Optional.of(reviewer));
    when(reviewRequestRepository.findById(reviewRequestId))
        .thenReturn(Optional.of(reviewRequest));
    when(reviewRequestRepository.save(any(ReviewRequest.class))).thenReturn(acceptedRequest);
    when(reviewRequestMapper.toResponse(acceptedRequest)).thenReturn(response);

    ReviewRequestResponse result =
        reviewRequestService.respondToReviewRequest(reviewerId, reviewRequestId, request);

    assertEquals(ReviewRequestStatus.ACCEPTED, result.getStatus());
    verify(reviewRequestRepository, times(1)).save(any(ReviewRequest.class));
  }

  // test respondToReviewRequest should reject request
  @Test
  @DisplayName("respondToReviewRequest should reject request")
  void respondToReviewRequest_ShouldRejectRequest() {
    RespondReviewRequestRequest request = RespondReviewRequestRequest.builder()
        .accept(false)
        .rejectionReason("Too busy")
        .build();

    ReviewRequest rejectedRequest = ReviewRequest.builder()
        .id(reviewRequestId)
        .document(document)
        .reviewer(reviewer)
        .status(ReviewRequestStatus.REJECTED)
        .rejectionReason("Too busy")
        .build();

    ReviewRequestResponse response = ReviewRequestResponse.builder()
        .id(reviewRequestId)
        .status(ReviewRequestStatus.REJECTED)
        .build();

    when(userRepository.findById(reviewerId)).thenReturn(Optional.of(reviewer));
    when(reviewRequestRepository.findById(reviewRequestId))
        .thenReturn(Optional.of(reviewRequest));
    when(reviewRequestRepository.save(any(ReviewRequest.class))).thenReturn(rejectedRequest);
    when(reviewRequestMapper.toResponse(rejectedRequest)).thenReturn(response);

    ReviewRequestResponse result =
        reviewRequestService.respondToReviewRequest(reviewerId, reviewRequestId, request);

    assertEquals(ReviewRequestStatus.REJECTED, result.getStatus());
  }

  // test respondToReviewRequest should throw exception when not reviewer
  @Test
  @DisplayName("respondToReviewRequest should throw exception when not reviewer")
  void respondToReviewRequest_ShouldThrowException_WhenNotReviewer() {
    User regularUser = User.builder()
        .id(UUID.randomUUID())
        .role(UserRole.READER)
        .build();

    RespondReviewRequestRequest request = RespondReviewRequestRequest.builder()
        .accept(true)
        .build();

    when(userRepository.findById(regularUser.getId())).thenReturn(Optional.of(regularUser));

    assertThrows(InvalidRequestException.class,
        () -> reviewRequestService.respondToReviewRequest(
            regularUser.getId(), reviewRequestId, request));
    verify(reviewRequestRepository, never()).save(any());
  }

  // test submitReview should submit review successfully
  @Test
  @DisplayName("submitReview should submit review successfully")
  void submitReview_ShouldSubmitReview() {
    ReviewRequest acceptedRequest = ReviewRequest.builder()
        .id(reviewRequestId)
        .document(document)
        .reviewer(reviewer)
        .status(ReviewRequestStatus.ACCEPTED)
        .build();

    SubmitReviewRequest request = SubmitReviewRequest.builder()
        .report("Document is well-written and accurate")
        .decision(ReviewDecision.APPROVED)
        .build();

    DocumentReview review = DocumentReview.builder()
        .id(UUID.randomUUID())
        .document(document)
        .reviewer(reviewer)
        .reviewRequest(acceptedRequest)
        .report("Document is well-written and accurate")
        .decision(ReviewDecision.APPROVED)
        .build();

    Document updatedDocument = Document.builder()
        .id(documentId)
        .title("Test Document")
        .status(DocStatus.ACTIVE)
        .isPremium(true)
        .build();

    DocumentReviewResponse response = DocumentReviewResponse.builder()
        .id(review.getId())
        .decision(ReviewDecision.APPROVED)
        .build();

    when(userRepository.findById(reviewerId)).thenReturn(Optional.of(reviewer));
    when(reviewRequestRepository.findById(reviewRequestId))
        .thenReturn(Optional.of(acceptedRequest));
    when(documentReviewRepository.save(any(DocumentReview.class))).thenReturn(review);
    when(documentRepository.save(any(Document.class))).thenReturn(updatedDocument);
    when(reviewRequestRepository.save(any(ReviewRequest.class))).thenReturn(acceptedRequest);
    when(documentReviewMapper.toResponse(review)).thenReturn(response);

    DocumentReviewResponse result =
        reviewRequestService.submitReview(reviewerId, reviewRequestId, request);

    assertNotNull(result);
    assertEquals(ReviewDecision.APPROVED, result.getDecision());
    verify(documentReviewRepository, times(1)).save(any(DocumentReview.class));
  }

  // test submitReview should throw exception when request not accepted
  @Test
  @DisplayName("submitReview should throw exception when request not accepted")
  void submitReview_ShouldThrowException_WhenRequestNotAccepted() {
    SubmitReviewRequest request = SubmitReviewRequest.builder()
        .report("Report")
        .decision(ReviewDecision.APPROVED)
        .build();

    when(userRepository.findById(reviewerId)).thenReturn(Optional.of(reviewer));
    when(reviewRequestRepository.findById(reviewRequestId))
        .thenReturn(Optional.of(reviewRequest));

    assertThrows(InvalidRequestException.class,
        () -> reviewRequestService.submitReview(reviewerId, reviewRequestId, request));
    verify(documentReviewRepository, never()).save(any());
  }

  // test getReviewerToDoDocuments should return accepted requests
  @Test
  @DisplayName("getReviewerToDoDocuments should return accepted requests")
  void getReviewerToDoDocuments_ShouldReturnAcceptedRequests() {
    Pageable pageable = PageRequest.of(0, 10);
    ReviewRequest acceptedRequest = ReviewRequest.builder()
        .id(reviewRequestId)
        .document(document)
        .reviewer(reviewer)
        .status(ReviewRequestStatus.ACCEPTED)
        .build();

    Page<ReviewRequest> requestPage = new PageImpl<>(Arrays.asList(acceptedRequest), pageable, 1);

    ReviewRequestResponse response = ReviewRequestResponse.builder()
        .id(reviewRequestId)
        .status(ReviewRequestStatus.ACCEPTED)
        .build();

    when(userRepository.findById(reviewerId)).thenReturn(Optional.of(reviewer));
    when(reviewRequestRepository.findByReviewer_IdAndStatus(
        reviewerId, ReviewRequestStatus.ACCEPTED, pageable)).thenReturn(requestPage);
    when(reviewRequestMapper.toResponse(acceptedRequest)).thenReturn(response);

    Page<ReviewRequestResponse> result =
        reviewRequestService.getReviewerToDoDocuments(reviewerId, pageable);

    assertEquals(1, result.getTotalElements());
    assertEquals(ReviewRequestStatus.ACCEPTED, result.getContent().get(0).getStatus());
  }

  // test getDocumentReviewRequests should return requests for document
  @Test
  @DisplayName("getDocumentReviewRequests should return requests for document")
  void getDocumentReviewRequests_ShouldReturnRequestsForDocument() {
    Pageable pageable = PageRequest.of(0, 10);
    Page<ReviewRequest> requestPage = new PageImpl<>(Arrays.asList(reviewRequest), pageable, 1);

    ReviewRequestResponse response = ReviewRequestResponse.builder()
        .id(reviewRequestId)
        .status(ReviewRequestStatus.PENDING)
        .build();

    when(documentRepository.existsById(documentId)).thenReturn(true);
    when(reviewRequestRepository.findByDocument_Id(documentId, pageable))
        .thenReturn(requestPage);
    when(reviewRequestMapper.toResponse(reviewRequest)).thenReturn(response);

    Page<ReviewRequestResponse> result =
        reviewRequestService.getDocumentReviewRequests(documentId, pageable);

    assertEquals(1, result.getTotalElements());
  }

  // test getAllReviewRequests should return all requests
  @Test
  @DisplayName("getAllReviewRequests should return all requests")
  void getAllReviewRequests_ShouldReturnAllRequests() {
    Pageable pageable = PageRequest.of(0, 10);
    Page<ReviewRequest> requestPage = new PageImpl<>(Arrays.asList(reviewRequest), pageable, 1);

    ReviewRequestResponse response = ReviewRequestResponse.builder()
        .id(reviewRequestId)
        .status(ReviewRequestStatus.PENDING)
        .build();

    when(reviewRequestRepository.findAll(pageable)).thenReturn(requestPage);
    when(reviewRequestMapper.toResponse(reviewRequest)).thenReturn(response);

    Page<ReviewRequestResponse> result = reviewRequestService.getAllReviewRequests(pageable);

    assertEquals(1, result.getTotalElements());
  }
}

