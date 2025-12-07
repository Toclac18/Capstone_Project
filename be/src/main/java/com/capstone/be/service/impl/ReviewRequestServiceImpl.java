package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.DocumentReview;
import com.capstone.be.domain.entity.DocumentTagLink;
import com.capstone.be.domain.entity.ReviewRequest;
import com.capstone.be.domain.entity.Tag;
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
import com.capstone.be.repository.DocumentTagLinkRepository;
import com.capstone.be.repository.ReviewRequestRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.service.FileStorageService;
import com.capstone.be.service.ReviewRequestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewRequestServiceImpl implements ReviewRequestService {

  private final ReviewRequestRepository reviewRequestRepository;
  private final DocumentRepository documentRepository;
  private final UserRepository userRepository;
  private final DocumentReviewRepository documentReviewRepository;
  private final ReviewRequestMapper reviewRequestMapper;
  private final DocumentReviewMapper documentReviewMapper;
  private final FileStorageService fileStorageService;
  private final DocumentTagLinkRepository documentTagLinkRepository;

  private static final int RESPONSE_DEADLINE_DAYS = 1;
  private static final int REVIEW_DEADLINE_DAYS = 3;

  @Override
  @Transactional
  public ReviewRequestResponse assignReviewer(UUID businessAdminId, UUID documentId, AssignReviewerRequest request) {
    log.info("Business Admin {} assigning reviewer {} to document {}", businessAdminId, request.getReviewerId(), documentId);

    // Validate Business Admin
    User businessAdmin = userRepository.findById(businessAdminId)
        .orElseThrow(() -> new ResourceNotFoundException("Business Admin not found with ID: " + businessAdminId));

    if (businessAdmin.getRole() != UserRole.BUSINESS_ADMIN) {
      throw new InvalidRequestException("Only Business Admin can assign reviewers");
    }

    // Validate Document
    Document document = documentRepository.findById(documentId)
        .orElseThrow(() -> new ResourceNotFoundException("Document not found with ID: " + documentId));

    // Check if document is premium
    if (document.getIsPremium() == null || !document.getIsPremium()) {
      throw new InvalidRequestException("Only premium documents can be assigned for review");
    }

    // Check if document status is AI_VERIFIED
    if (document.getStatus() != DocStatus.AI_VERIFIED) {
      throw new InvalidRequestException("Only documents with AI_VERIFIED status can be assigned for review. Current status: " + document.getStatus());
    }

    // Validate Reviewer
    User reviewer = userRepository.findById(request.getReviewerId())
        .orElseThrow(() -> new ResourceNotFoundException("Reviewer not found with ID: " + request.getReviewerId()));

    if (reviewer.getRole() != UserRole.REVIEWER) {
      throw new InvalidRequestException("User is not a reviewer");
    }

    // Check if already assigned to this reviewer
    if (reviewRequestRepository.existsByDocument_IdAndReviewer_Id(documentId, request.getReviewerId())) {
      throw new InvalidRequestException("This reviewer has already been assigned to this document");
    }

    // Calculate deadlines (làm tròn tới 0h ngày tiếp theo)
    Instant now = Instant.now();
    Instant responseDeadline = calculateDeadline(now, RESPONSE_DEADLINE_DAYS);

    // Create ReviewRequest
    ReviewRequest reviewRequest = ReviewRequest.builder()
        .document(document)
        .reviewer(reviewer)
        .assignedBy(businessAdmin)
        .status(ReviewRequestStatus.PENDING)
        .responseDeadline(responseDeadline)
        .note(request.getNote())
        .build();

    reviewRequest = reviewRequestRepository.save(reviewRequest);

    log.info("Successfully assigned reviewer {} to document {}", request.getReviewerId(), documentId);

    return reviewRequestMapper.toResponse(reviewRequest);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<ReviewRequestResponse> getReviewerPendingRequests(UUID reviewerId, Pageable pageable) {
    log.info("Getting pending review requests for reviewer {}", reviewerId);

    // Validate Reviewer
    User reviewer = userRepository.findById(reviewerId)
        .orElseThrow(() -> new ResourceNotFoundException("Reviewer not found with ID: " + reviewerId));

    if (reviewer.getRole() != UserRole.REVIEWER) {
      throw new InvalidRequestException("User is not a reviewer");
    }

    Page<ReviewRequest> requests = reviewRequestRepository.findByReviewer_IdAndStatus(
        reviewerId,
        ReviewRequestStatus.PENDING,
        pageable
    );

    return requests.map(reviewRequestMapper::toResponse);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<ReviewRequestResponse> getReviewerAllRequests(UUID reviewerId, Pageable pageable) {
    log.info("Getting all review requests for reviewer {}", reviewerId);

    // Validate Reviewer
    User reviewer = userRepository.findById(reviewerId)
        .orElseThrow(() -> new ResourceNotFoundException("Reviewer not found with ID: " + reviewerId));

    if (reviewer.getRole() != UserRole.REVIEWER) {
      throw new InvalidRequestException("User is not a reviewer");
    }

    Page<ReviewRequest> requests = reviewRequestRepository.findByReviewer_Id(reviewerId, pageable);

    return requests.map(reviewRequestMapper::toResponse);
  }

  @Override
  @Transactional
  public ReviewRequestResponse respondToReviewRequest(UUID reviewerId, UUID reviewRequestId, RespondReviewRequestRequest request) {
    log.info("Reviewer {} responding to review request {}: accept={}", reviewerId, reviewRequestId, request.getAccept());

    // Validate Reviewer
    User reviewer = userRepository.findById(reviewerId)
        .orElseThrow(() -> new ResourceNotFoundException("Reviewer not found with ID: " + reviewerId));

    if (reviewer.getRole() != UserRole.REVIEWER) {
      throw new InvalidRequestException("User is not a reviewer");
    }

    // Get ReviewRequest
    ReviewRequest reviewRequest = reviewRequestRepository.findById(reviewRequestId)
        .orElseThrow(() -> new ResourceNotFoundException("Review request not found with ID: " + reviewRequestId));

    // Verify this request belongs to the reviewer
    if (!reviewRequest.getReviewer().getId().equals(reviewerId)) {
      throw new InvalidRequestException("This review request does not belong to you");
    }

    // Check if request is still pending
    if (reviewRequest.getStatus() != ReviewRequestStatus.PENDING) {
      throw new InvalidRequestException("This review request has already been responded to. Current status: " + reviewRequest.getStatus());
    }

    // Check if response deadline has passed
    Instant now = Instant.now();
    if (now.isAfter(reviewRequest.getResponseDeadline())) {
      // Auto-expire the request
      reviewRequest.setStatus(ReviewRequestStatus.EXPIRED);
      reviewRequestRepository.save(reviewRequest);
      throw new InvalidRequestException("The response deadline has passed. This request has been marked as expired.");
    }

    // Update status based on response
    Instant respondedAt = Instant.now();
    reviewRequest.setRespondedAt(respondedAt);

    if (request.getAccept()) {
      reviewRequest.setStatus(ReviewRequestStatus.ACCEPTED);
      // Calculate review deadline (3 days from acceptance)
      Instant reviewDeadline = calculateDeadline(respondedAt, REVIEW_DEADLINE_DAYS);
      reviewRequest.setReviewDeadline(reviewDeadline);
      log.info("Reviewer {} accepted review request {}. Review deadline: {}", reviewerId, reviewRequestId, reviewDeadline);
    } else {
      reviewRequest.setStatus(ReviewRequestStatus.REJECTED);
      reviewRequest.setRejectionReason(request.getRejectionReason());
      log.info("Reviewer {} rejected review request {}", reviewerId, reviewRequestId);
    }

    reviewRequest = reviewRequestRepository.save(reviewRequest);

    return reviewRequestMapper.toResponse(reviewRequest);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<ReviewRequestResponse> getReviewerToDoDocuments(UUID reviewerId, Pageable pageable) {
    log.info("Getting to-do review documents for reviewer {}", reviewerId);

    // Validate Reviewer
    User reviewer = userRepository.findById(reviewerId)
        .orElseThrow(() -> new ResourceNotFoundException("Reviewer not found with ID: " + reviewerId));

    if (reviewer.getRole() != UserRole.REVIEWER) {
      throw new InvalidRequestException("User is not a reviewer");
    }

    // Get all ACCEPTED review requests
    Page<ReviewRequest> requests = reviewRequestRepository.findByReviewer_IdAndStatus(
        reviewerId,
        ReviewRequestStatus.ACCEPTED,
        pageable
    );

    return requests.map(reviewRequestMapper::toResponse);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<ReviewRequestResponse> getDocumentReviewRequests(UUID documentId, Pageable pageable) {
    log.info("Getting review requests for document {}", documentId);

    // Validate document exists
    if (!documentRepository.existsById(documentId)) {
      throw new ResourceNotFoundException("Document not found with ID: " + documentId);
    }

    Page<ReviewRequest> requests = reviewRequestRepository.findByDocument_Id(documentId, pageable);

    return requests.map(reviewRequestMapper::toResponse);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<ReviewRequestResponse> getAllReviewRequests(Pageable pageable) {
    log.info("Getting all review requests (page: {}, size: {})", pageable.getPageNumber(), pageable.getPageSize());

    Page<ReviewRequest> requests = reviewRequestRepository.findAll(pageable);

    return requests.map(reviewRequestMapper::toResponse);
  }

  @Override
  @Transactional
  public DocumentReviewResponse submitReview(UUID reviewerId, UUID reviewRequestId, SubmitReviewRequest request, MultipartFile reportFile) {
    log.info("Reviewer {} submitting review for review request {}: decision={}, file={}",
        reviewerId, reviewRequestId, request.getDecision(), reportFile != null ? reportFile.getOriginalFilename() : "null");

    // Validate Reviewer
    User reviewer = userRepository.findById(reviewerId)
        .orElseThrow(() -> new ResourceNotFoundException("Reviewer not found with ID: " + reviewerId));

    if (reviewer.getRole() != UserRole.REVIEWER) {
      throw new InvalidRequestException("User is not a reviewer");
    }

    // Get ReviewRequest
    ReviewRequest reviewRequest = reviewRequestRepository.findById(reviewRequestId)
        .orElseThrow(() -> new ResourceNotFoundException("Review request not found with ID: " + reviewRequestId));

    // Verify this request belongs to the reviewer
    if (!reviewRequest.getReviewer().getId().equals(reviewerId)) {
      throw new InvalidRequestException("This review request does not belong to you");
    }

    // Check if request is ACCEPTED
    if (reviewRequest.getStatus() != ReviewRequestStatus.ACCEPTED) {
      throw new InvalidRequestException("Can only submit review for accepted review requests. Current status: " + reviewRequest.getStatus());
    }

    // Check if review has already been submitted
    if (documentReviewRepository.existsByReviewRequest_Id(reviewRequestId)) {
      throw new InvalidRequestException("Review has already been submitted for this review request");
    }

    // Validate report file
    if (reportFile == null || reportFile.isEmpty()) {
      throw new InvalidRequestException("Review report file is required");
    }

    // Validate file type (accept .doc, .docx)
    String originalFilename = reportFile.getOriginalFilename();
    if (originalFilename == null || (!originalFilename.endsWith(".doc") && !originalFilename.endsWith(".docx"))) {
      throw new InvalidRequestException("Review report file must be a Word document (.doc or .docx)");
    }

    // Check if review deadline has passed
    Instant now = Instant.now();
    if (reviewRequest.getReviewDeadline() != null && now.isAfter(reviewRequest.getReviewDeadline())) {
      log.warn("Review deadline has passed for review request {}", reviewRequestId);
      // We allow submission but log a warning
    }

    // Get document
    Document document = reviewRequest.getDocument();

    // Upload review report file to S3
    String customFilename = String.format("review_%s_%s", reviewRequestId, originalFilename);
    String reportFilePath = fileStorageService.uploadFile(
        reportFile,
        com.capstone.be.config.constant.FileStorage.REVIEW_REPORT_FOLDER,
        customFilename
    );
    log.info("Uploaded review report file to S3: {}", reportFilePath);

    // Create DocumentReview
    DocumentReview documentReview = DocumentReview.builder()
        .reviewRequest(reviewRequest)
        .document(document)
        .reviewer(reviewer)
        .comment(request.getReport())
        .reportFilePath(reportFilePath)
        .decision(request.getDecision())
        .submittedAt(now)
        .build();

    documentReview = documentReviewRepository.save(documentReview);

    // Update document status based on decision
    if (request.getDecision() == ReviewDecision.APPROVED) {
      document.setStatus(DocStatus.ACTIVE);
      log.info("Document {} status updated to ACTIVE", document.getId());
    } else if (request.getDecision() == ReviewDecision.REJECTED) {
      document.setStatus(DocStatus.REJECTED);
      log.info("Document {} status updated to REJECTED", document.getId());
    }

    documentRepository.save(document);

    // Update review request status to COMPLETED
    reviewRequest.setStatus(ReviewRequestStatus.COMPLETED);
    reviewRequestRepository.save(reviewRequest);

    log.info("Successfully submitted review for document {}", document.getId());

    // Load tags for the document
    List<Tag> tags = documentTagLinkRepository.findByDocument_Id(document.getId())
        .stream()
        .map(DocumentTagLink::getTag)
        .collect(Collectors.toList());

    return documentReviewMapper.toResponse(documentReview, tags);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<DocumentReviewResponse> getReviewerHistory(UUID reviewerId, Pageable pageable) {
    log.info("Getting review history for reviewer {}", reviewerId);

    // Validate Reviewer
    User reviewer = userRepository.findById(reviewerId)
        .orElseThrow(() -> new ResourceNotFoundException("Reviewer not found with ID: " + reviewerId));

    if (reviewer.getRole() != UserRole.REVIEWER) {
      throw new InvalidRequestException("User is not a reviewer");
    }

    Page<DocumentReview> reviews = documentReviewRepository.findByReviewer_Id(reviewerId, pageable);

    return reviews.map(review -> {
      // Load tags for each document
      List<Tag> tags = documentTagLinkRepository.findByDocument_Id(review.getDocument().getId())
          .stream()
          .map(DocumentTagLink::getTag)
          .collect(Collectors.toList());
      return documentReviewMapper.toResponse(review, tags);
    });
  }

  /**
   * Calculate deadline (làm tròn tới 0h của ngày tiếp theo)
   * Ví dụ: Nếu hiện tại là 2025-01-15 14:30:00 và days = 1
   * => deadline = 2025-01-17 00:00:00 (làm tròn lên đến đầu ngày thứ 2)
   */
  private Instant calculateDeadline(Instant from, int days) {
    LocalDate fromDate = from.atZone(ZoneId.systemDefault()).toLocalDate();
    LocalDate deadlineDate = fromDate.plusDays(days + 1); // +1 để làm tròn lên ngày tiếp theo
    return deadlineDate.atStartOfDay(ZoneId.systemDefault()).toInstant();
  }
}
