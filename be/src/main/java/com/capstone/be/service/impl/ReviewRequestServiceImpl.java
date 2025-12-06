package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.ReviewRequest;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.ReviewRequestStatus;
import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.dto.request.review.AssignReviewerRequest;
import com.capstone.be.dto.response.review.ReviewRequestResponse;
import com.capstone.be.exception.InvalidRequestException;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.mapper.ReviewRequestMapper;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.ReviewRequestRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.service.ReviewRequestService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewRequestServiceImpl implements ReviewRequestService {

  private final ReviewRequestRepository reviewRequestRepository;
  private final DocumentRepository documentRepository;
  private final UserRepository userRepository;
  private final ReviewRequestMapper reviewRequestMapper;

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
