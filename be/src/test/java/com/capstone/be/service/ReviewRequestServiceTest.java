package com.capstone.be.service;

import com.capstone.be.config.constant.FileStorage;
import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.DocumentReview;
import com.capstone.be.domain.entity.ReviewRequest;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.ReviewDecision;
import com.capstone.be.domain.enums.ReviewRequestStatus;
import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.dto.request.review.SubmitReviewRequest;
import com.capstone.be.dto.response.review.DocumentReviewResponse;
import com.capstone.be.exception.InvalidRequestException;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.mapper.DocumentReviewMapper;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.DocumentReviewRepository;
import com.capstone.be.repository.ReviewRequestRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.service.impl.ReviewRequestServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
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
  private DocumentReviewMapper documentReviewMapper;

  @Mock
  private FileStorageService fileStorageService;

  @InjectMocks
  private ReviewRequestServiceImpl reviewRequestService;

  private User reviewer;
  private Document document;
  private ReviewRequest reviewRequest;
  private SubmitReviewRequest submitRequest;
  private MultipartFile reportFile;

  @BeforeEach
  void setUp() {
    reviewer = User.builder()
        .id(UUID.randomUUID())
        .fullName("Test Reviewer")
        .email("reviewer@test.com")
        .role(UserRole.REVIEWER)
        .build();

    document = Document.builder()
        .id(UUID.randomUUID())
        .title("Test Document")
        .status(DocStatus.REVIEWING)
        .build();

    reviewRequest = ReviewRequest.builder()
        .id(UUID.randomUUID())
        .document(document)
        .reviewer(reviewer)
        .status(ReviewRequestStatus.ACCEPTED)
        .reviewDeadline(Instant.now().plusSeconds(86400))
        .build();

    submitRequest = SubmitReviewRequest.builder()
        .report("This is my review comment")
        .decision(ReviewDecision.APPROVED)
        .build();

    reportFile = mock(MultipartFile.class);
  }

  @Test
  @DisplayName("Should submit review successfully with file upload")
  void submitReview_Success() {
    // Given
    UUID reviewerId = reviewer.getId();
    UUID reviewRequestId = reviewRequest.getId();
    String originalFilename = "review_report.docx";
    String uploadedFilePath = "review-reports/review_" + reviewRequestId + "_" + originalFilename;

    when(userRepository.findById(reviewerId)).thenReturn(Optional.of(reviewer));
    when(reviewRequestRepository.findById(reviewRequestId)).thenReturn(Optional.of(reviewRequest));
    when(documentReviewRepository.existsByReviewRequest_Id(reviewRequestId)).thenReturn(false);
    when(reportFile.isEmpty()).thenReturn(false);
    when(reportFile.getOriginalFilename()).thenReturn(originalFilename);
    when(fileStorageService.uploadFile(eq(reportFile), eq(FileStorage.REVIEW_REPORT_FOLDER), anyString()))
        .thenReturn(uploadedFilePath);

    DocumentReview savedReview = DocumentReview.builder()
        .id(UUID.randomUUID())
        .reviewRequest(reviewRequest)
        .document(document)
        .reviewer(reviewer)
        .comment(submitRequest.getReport())
        .reportFilePath(uploadedFilePath)
        .decision(ReviewDecision.APPROVED)
        .submittedAt(Instant.now())
        .build();

    when(documentReviewRepository.save(any(DocumentReview.class))).thenReturn(savedReview);

    DocumentReviewResponse expectedResponse = DocumentReviewResponse.builder()
        .id(savedReview.getId())
        .report(submitRequest.getReport())
        .reportFileUrl(uploadedFilePath)
        .decision(ReviewDecision.APPROVED)
        .build();

    when(documentReviewMapper.toResponse(any(DocumentReview.class))).thenReturn(expectedResponse);

    // When
    DocumentReviewResponse result = reviewRequestService.submitReview(reviewerId, reviewRequestId, submitRequest, reportFile);

    // Then
    assertThat(result).isNotNull();
    assertThat(result.getReport()).isEqualTo(submitRequest.getReport());
    assertThat(result.getReportFileUrl()).isEqualTo(uploadedFilePath);
    assertThat(result.getDecision()).isEqualTo(ReviewDecision.APPROVED);

    verify(fileStorageService).uploadFile(eq(reportFile), eq(FileStorage.REVIEW_REPORT_FOLDER), anyString());
    verify(documentReviewRepository).save(any(DocumentReview.class));
    verify(documentRepository).save(document);
    verify(reviewRequestRepository).save(reviewRequest);
    assertThat(document.getStatus()).isEqualTo(DocStatus.ACTIVE);
    assertThat(reviewRequest.getStatus()).isEqualTo(ReviewRequestStatus.COMPLETED);
  }

  @Test
  @DisplayName("Should throw exception when reviewer not found")
  void submitReview_ReviewerNotFound() {
    // Given
    UUID reviewerId = UUID.randomUUID();
    UUID reviewRequestId = UUID.randomUUID();

    when(userRepository.findById(reviewerId)).thenReturn(Optional.empty());

    // When & Then
    assertThatThrownBy(() -> reviewRequestService.submitReview(reviewerId, reviewRequestId, submitRequest, reportFile))
        .isInstanceOf(ResourceNotFoundException.class)
        .hasMessageContaining("Reviewer not found");

    verify(documentReviewRepository, never()).save(any());
  }

  @Test
  @DisplayName("Should throw exception when user is not a reviewer")
  void submitReview_UserNotReviewer() {
    // Given
    UUID reviewerId = reviewer.getId();
    UUID reviewRequestId = reviewRequest.getId();
    reviewer.setRole(UserRole.BUSINESS_ADMIN);

    when(userRepository.findById(reviewerId)).thenReturn(Optional.of(reviewer));

    // When & Then
    assertThatThrownBy(() -> reviewRequestService.submitReview(reviewerId, reviewRequestId, submitRequest, reportFile))
        .isInstanceOf(InvalidRequestException.class)
        .hasMessageContaining("User is not a reviewer");

    verify(documentReviewRepository, never()).save(any());
  }

  @Test
  @DisplayName("Should throw exception when review request not found")
  void submitReview_ReviewRequestNotFound() {
    // Given
    UUID reviewerId = reviewer.getId();
    UUID reviewRequestId = UUID.randomUUID();

    when(userRepository.findById(reviewerId)).thenReturn(Optional.of(reviewer));
    when(reviewRequestRepository.findById(reviewRequestId)).thenReturn(Optional.empty());

    // When & Then
    assertThatThrownBy(() -> reviewRequestService.submitReview(reviewerId, reviewRequestId, submitRequest, reportFile))
        .isInstanceOf(ResourceNotFoundException.class)
        .hasMessageContaining("Review request not found");

    verify(documentReviewRepository, never()).save(any());
  }

  @Test
  @DisplayName("Should throw exception when review request doesn't belong to reviewer")
  void submitReview_ReviewRequestNotBelongToReviewer() {
    // Given
    UUID reviewerId = reviewer.getId();
    UUID reviewRequestId = reviewRequest.getId();
    User anotherReviewer = User.builder()
        .id(UUID.randomUUID())
        .role(UserRole.REVIEWER)
        .build();
    reviewRequest.setReviewer(anotherReviewer);

    when(userRepository.findById(reviewerId)).thenReturn(Optional.of(reviewer));
    when(reviewRequestRepository.findById(reviewRequestId)).thenReturn(Optional.of(reviewRequest));

    // When & Then
    assertThatThrownBy(() -> reviewRequestService.submitReview(reviewerId, reviewRequestId, submitRequest, reportFile))
        .isInstanceOf(InvalidRequestException.class)
        .hasMessageContaining("This review request does not belong to you");

    verify(documentReviewRepository, never()).save(any());
  }

  @Test
  @DisplayName("Should throw exception when review request status is not ACCEPTED")
  void submitReview_ReviewRequestNotAccepted() {
    // Given
    UUID reviewerId = reviewer.getId();
    UUID reviewRequestId = reviewRequest.getId();
    reviewRequest.setStatus(ReviewRequestStatus.PENDING);

    when(userRepository.findById(reviewerId)).thenReturn(Optional.of(reviewer));
    when(reviewRequestRepository.findById(reviewRequestId)).thenReturn(Optional.of(reviewRequest));

    // When & Then
    assertThatThrownBy(() -> reviewRequestService.submitReview(reviewerId, reviewRequestId, submitRequest, reportFile))
        .isInstanceOf(InvalidRequestException.class)
        .hasMessageContaining("Can only submit review for accepted review requests");

    verify(documentReviewRepository, never()).save(any());
  }

  @Test
  @DisplayName("Should throw exception when review already submitted")
  void submitReview_ReviewAlreadySubmitted() {
    // Given
    UUID reviewerId = reviewer.getId();
    UUID reviewRequestId = reviewRequest.getId();

    when(userRepository.findById(reviewerId)).thenReturn(Optional.of(reviewer));
    when(reviewRequestRepository.findById(reviewRequestId)).thenReturn(Optional.of(reviewRequest));
    when(documentReviewRepository.existsByReviewRequest_Id(reviewRequestId)).thenReturn(true);

    // When & Then
    assertThatThrownBy(() -> reviewRequestService.submitReview(reviewerId, reviewRequestId, submitRequest, reportFile))
        .isInstanceOf(InvalidRequestException.class)
        .hasMessageContaining("Review has already been submitted");

    verify(documentReviewRepository, never()).save(any());
  }

  @Test
  @DisplayName("Should throw exception when report file is null")
  void submitReview_ReportFileNull() {
    // Given
    UUID reviewerId = reviewer.getId();
    UUID reviewRequestId = reviewRequest.getId();

    when(userRepository.findById(reviewerId)).thenReturn(Optional.of(reviewer));
    when(reviewRequestRepository.findById(reviewRequestId)).thenReturn(Optional.of(reviewRequest));
    when(documentReviewRepository.existsByReviewRequest_Id(reviewRequestId)).thenReturn(false);

    // When & Then
    assertThatThrownBy(() -> reviewRequestService.submitReview(reviewerId, reviewRequestId, submitRequest, null))
        .isInstanceOf(InvalidRequestException.class)
        .hasMessageContaining("Review report file is required");

    verify(documentReviewRepository, never()).save(any());
  }

  @Test
  @DisplayName("Should throw exception when report file is empty")
  void submitReview_ReportFileEmpty() {
    // Given
    UUID reviewerId = reviewer.getId();
    UUID reviewRequestId = reviewRequest.getId();

    when(userRepository.findById(reviewerId)).thenReturn(Optional.of(reviewer));
    when(reviewRequestRepository.findById(reviewRequestId)).thenReturn(Optional.of(reviewRequest));
    when(documentReviewRepository.existsByReviewRequest_Id(reviewRequestId)).thenReturn(false);
    when(reportFile.isEmpty()).thenReturn(true);

    // When & Then
    assertThatThrownBy(() -> reviewRequestService.submitReview(reviewerId, reviewRequestId, submitRequest, reportFile))
        .isInstanceOf(InvalidRequestException.class)
        .hasMessageContaining("Review report file is required");

    verify(documentReviewRepository, never()).save(any());
  }

  @Test
  @DisplayName("Should throw exception when file is not a Word document")
  void submitReview_InvalidFileType() {
    // Given
    UUID reviewerId = reviewer.getId();
    UUID reviewRequestId = reviewRequest.getId();

    when(userRepository.findById(reviewerId)).thenReturn(Optional.of(reviewer));
    when(reviewRequestRepository.findById(reviewRequestId)).thenReturn(Optional.of(reviewRequest));
    when(documentReviewRepository.existsByReviewRequest_Id(reviewRequestId)).thenReturn(false);
    when(reportFile.isEmpty()).thenReturn(false);
    when(reportFile.getOriginalFilename()).thenReturn("report.pdf");

    // When & Then
    assertThatThrownBy(() -> reviewRequestService.submitReview(reviewerId, reviewRequestId, submitRequest, reportFile))
        .isInstanceOf(InvalidRequestException.class)
        .hasMessageContaining("Review report file must be a Word document");

    verify(documentReviewRepository, never()).save(any());
  }

  @Test
  @DisplayName("Should update document status to REJECTED when decision is REJECTED")
  void submitReview_RejectDocument() {
    // Given
    UUID reviewerId = reviewer.getId();
    UUID reviewRequestId = reviewRequest.getId();
    String originalFilename = "review_report.docx";
    String uploadedFilePath = "review-reports/review_" + reviewRequestId + "_" + originalFilename;

    submitRequest.setDecision(ReviewDecision.REJECTED);

    when(userRepository.findById(reviewerId)).thenReturn(Optional.of(reviewer));
    when(reviewRequestRepository.findById(reviewRequestId)).thenReturn(Optional.of(reviewRequest));
    when(documentReviewRepository.existsByReviewRequest_Id(reviewRequestId)).thenReturn(false);
    when(reportFile.isEmpty()).thenReturn(false);
    when(reportFile.getOriginalFilename()).thenReturn(originalFilename);
    when(fileStorageService.uploadFile(eq(reportFile), eq(FileStorage.REVIEW_REPORT_FOLDER), anyString()))
        .thenReturn(uploadedFilePath);

    DocumentReview savedReview = DocumentReview.builder()
        .id(UUID.randomUUID())
        .reviewRequest(reviewRequest)
        .document(document)
        .reviewer(reviewer)
        .comment(submitRequest.getReport())
        .reportFilePath(uploadedFilePath)
        .decision(ReviewDecision.REJECTED)
        .submittedAt(Instant.now())
        .build();

    when(documentReviewRepository.save(any(DocumentReview.class))).thenReturn(savedReview);
    when(documentReviewMapper.toResponse(any(DocumentReview.class))).thenReturn(DocumentReviewResponse.builder().build());

    // When
    reviewRequestService.submitReview(reviewerId, reviewRequestId, submitRequest, reportFile);

    // Then
    assertThat(document.getStatus()).isEqualTo(DocStatus.REJECTED);
    verify(documentRepository).save(document);
  }
}
