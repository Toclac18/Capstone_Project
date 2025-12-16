package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.ReviewResult;
import com.capstone.be.domain.entity.DocumentTagLink;
import com.capstone.be.domain.entity.ReviewRequest;
import com.capstone.be.domain.entity.Tag;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.ReviewDecision;
import com.capstone.be.domain.enums.ReviewRequestStatus;
import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.dto.request.review.ApproveReviewResultRequest;
import com.capstone.be.dto.request.review.AssignReviewerRequest;
import com.capstone.be.dto.request.review.RespondReviewRequestRequest;
import com.capstone.be.dto.request.review.ReviewHistoryFilterRequest;
import com.capstone.be.dto.request.review.SubmitReviewRequest;
import com.capstone.be.domain.enums.ReviewResultStatus;
import com.capstone.be.dto.response.review.ReviewResultResponse;
import com.capstone.be.dto.response.review.ReviewRequestResponse;
import com.capstone.be.exception.InvalidRequestException;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.mapper.ReviewResultMapper;
import com.capstone.be.mapper.ReviewRequestMapper;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.ReviewResultRepository;
import com.capstone.be.repository.DocumentTagLinkRepository;
import com.capstone.be.repository.ReviewRequestRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.repository.spec.ReviewResultSpecification;
import com.capstone.be.service.DocumentConversionService;
import com.capstone.be.service.FileStorageService;
import com.capstone.be.service.ReviewRequestService;
import com.capstone.be.util.ByteArrayMultipartFile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewRequestServiceImpl implements ReviewRequestService {

  private final ReviewRequestRepository reviewRequestRepository;
  private final DocumentRepository documentRepository;
  private final UserRepository userRepository;
  private final ReviewResultRepository reviewResultRepository;
  private final ReviewRequestMapper reviewRequestMapper;
  private final ReviewResultMapper reviewResultMapper;
  private final FileStorageService fileStorageService;
  private final DocumentTagLinkRepository documentTagLinkRepository;
  private final DocumentConversionService documentConversionService;

  private static final int RESPONSE_DEADLINE_DAYS = 1;
  private static final int REVIEW_DEADLINE_DAYS = 2;
  private static final int PRESIGNED_URL_EXPIRATION_MINUTES = 60; // 1 hour

  @Override
  @Transactional
  public ReviewRequestResponse assignReviewer(UUID businessAdminId, UUID documentId, AssignReviewerRequest request) {
    log.info("Business Admin {} assigning reviewer {} to document {} - existingReviewRequestId: {}", 
        businessAdminId, request.getReviewerId(), documentId, request.getExistingReviewRequestId());

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

    // Check if document status is PENDING_REVIEW
    if (document.getStatus() != DocStatus.PENDING_REVIEW) {
      throw new InvalidRequestException("Only documents with PENDING_REVIEW status can be assigned for review. Current status: " + document.getStatus());
    }

    // Validate Reviewer
    User reviewer = userRepository.findById(request.getReviewerId())
        .orElseThrow(() -> new ResourceNotFoundException("Reviewer not found with ID: " + request.getReviewerId()));

    if (reviewer.getRole() != UserRole.REVIEWER) {
      throw new InvalidRequestException("User is not a reviewer");
    }

    // If changing reviewer, update the existing PENDING review request
    if (request.getExistingReviewRequestId() != null) {
      log.info("Changing reviewer for existing review request {} to reviewer {} for document {}", 
          request.getExistingReviewRequestId(), request.getReviewerId(), documentId);
      
      ReviewRequest existingRequest = reviewRequestRepository.findById(request.getExistingReviewRequestId())
          .orElseThrow(() -> new ResourceNotFoundException("Existing review request not found with ID: " + request.getExistingReviewRequestId()));
      
      log.info("Found existing review request: id={}, status={}, currentReviewer={}, document={}", 
          existingRequest.getId(), existingRequest.getStatus(), existingRequest.getReviewer().getId(), existingRequest.getDocument().getId());
      
      // Verify the existing request belongs to this document
      if (!existingRequest.getDocument().getId().equals(documentId)) {
        throw new InvalidRequestException("Existing review request does not belong to this document");
      }
      
      // Only allow change if status is PENDING (cannot change if already ACCEPTED, COMPLETED, etc.)
      if (existingRequest.getStatus() != ReviewRequestStatus.PENDING) {
        throw new InvalidRequestException("Cannot change reviewer. Existing review request status is " + existingRequest.getStatus() + ". Only PENDING requests can be changed.");
      }
      
      // Check if new reviewer is different from current reviewer
      if (existingRequest.getReviewer().getId().equals(request.getReviewerId())) {
        throw new InvalidRequestException("The new reviewer is the same as the current reviewer");
      }
      
      // Check if new reviewer is already assigned to this document (in another review request, excluding current one)
      Optional<ReviewRequest> existingAssignment = reviewRequestRepository.findByDocument_IdAndReviewer_Id(documentId, request.getReviewerId());
      if (existingAssignment.isPresent() && !existingAssignment.get().getId().equals(existingRequest.getId())) {
        log.warn("Reviewer {} is already assigned to document {} in review request {}", 
            request.getReviewerId(), documentId, existingAssignment.get().getId());
        throw new InvalidRequestException("This reviewer has already been assigned to this document");
      }
      
      // Update reviewer and assignedBy
      UUID oldReviewerId = existingRequest.getReviewer().getId();
      existingRequest.setReviewer(reviewer);
      existingRequest.setAssignedBy(businessAdmin);
      
      // Update note if provided
      if (request.getNote() != null) {
        existingRequest.setNote(request.getNote());
      }
      
      // Reset response deadline (1 day from now)
      Instant now = Instant.now();
      Instant responseDeadline = calculateDeadline(now, RESPONSE_DEADLINE_DAYS);
      existingRequest.setResponseDeadline(responseDeadline);
      
      // Reset respondedAt if it was set
      existingRequest.setRespondedAt(null);
      
      ReviewRequest updatedRequest = reviewRequestRepository.save(existingRequest);
      
      log.info("Successfully changed reviewer for review request {} from {} to {} for document {}", 
          updatedRequest.getId(), oldReviewerId, request.getReviewerId(), documentId);
      
      // Load tags for the document
      List<Tag> tags = documentTagLinkRepository.findByDocument_Id(updatedRequest.getDocument().getId())
          .stream()
          .map(DocumentTagLink::getTag)
          .collect(Collectors.toList());
      return reviewRequestMapper.toResponse(updatedRequest, tags);
    }

    // New assignment: Check if already assigned to this reviewer
    if (reviewRequestRepository.existsByDocument_IdAndReviewer_Id(documentId, request.getReviewerId())) {
      throw new InvalidRequestException("This reviewer has already been assigned to this document");
    }

    // Calculate deadlines (làm tròn tới 0h ngày tiếp theo)
    Instant now = Instant.now();
    Instant responseDeadline = calculateDeadline(now, RESPONSE_DEADLINE_DAYS);

    // Create new ReviewRequest
    ReviewRequest reviewRequest = ReviewRequest.builder()
        .document(document)
        .reviewer(reviewer)
        .assignedBy(businessAdmin)
        .status(ReviewRequestStatus.PENDING)
        .responseDeadline(responseDeadline)
        .note(request.getNote())
        .build();

    reviewRequest = reviewRequestRepository.save(reviewRequest);

    // Document status remains PENDING_REVIEW until reviewer accepts
    // Will be updated to REVIEWING when reviewer accepts the request
    log.info("Successfully assigned reviewer {} to document {}. Review request created with PENDING status", request.getReviewerId(), documentId);

    // Load tags for the document
    List<Tag> tags = documentTagLinkRepository.findByDocument_Id(reviewRequest.getDocument().getId())
        .stream()
        .map(DocumentTagLink::getTag)
        .collect(Collectors.toList());
    return reviewRequestMapper.toResponse(reviewRequest, tags);
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

    return requests.map(request -> {
      // Load tags for the document
      List<Tag> tags = documentTagLinkRepository.findByDocument_Id(request.getDocument().getId())
          .stream()
          .map(DocumentTagLink::getTag)
          .collect(Collectors.toList());
      return reviewRequestMapper.toResponse(request, tags);
    });
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

    return requests.map(request -> {
      // Load tags for the document
      List<Tag> tags = documentTagLinkRepository.findByDocument_Id(request.getDocument().getId())
          .stream()
          .map(DocumentTagLink::getTag)
          .collect(Collectors.toList());
      return reviewRequestMapper.toResponse(request, tags);
    });
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

    // Get document
    Document document = reviewRequest.getDocument();

    if (request.getAccept()) {
      reviewRequest.setStatus(ReviewRequestStatus.ACCEPTED);
      // Calculate review deadline (2 days from acceptance)
      Instant reviewDeadline = calculateDeadline(respondedAt, REVIEW_DEADLINE_DAYS);
      reviewRequest.setReviewDeadline(reviewDeadline);
      
      // Update document status to REVIEWING when reviewer accepts
      document.setStatus(DocStatus.REVIEWING);
      documentRepository.save(document);
      
      log.info("Reviewer {} accepted review request {}. Document status updated to REVIEWING. Review deadline: {}", reviewerId, reviewRequestId, reviewDeadline);
    } else {
      reviewRequest.setStatus(ReviewRequestStatus.REJECTED);
      reviewRequest.setRejectionReason(request.getRejectionReason());
      // Document status remains PENDING_REVIEW if reviewer rejects
      // Business admin can assign another reviewer
      log.info("Reviewer {} rejected review request {}", reviewerId, reviewRequestId);
    }

    reviewRequest = reviewRequestRepository.save(reviewRequest);

    // Load tags for the document
    List<Tag> tags = documentTagLinkRepository.findByDocument_Id(reviewRequest.getDocument().getId())
        .stream()
        .map(DocumentTagLink::getTag)
        .collect(Collectors.toList());
    return reviewRequestMapper.toResponse(reviewRequest, tags);
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

    // Get ACCEPTED review requests that don't have a submitted review yet
    // OR have a review that was REJECTED by BA (needs re-review)
    Page<ReviewRequest> requests = reviewRequestRepository.findAcceptedRequestsWithoutSubmittedReview(
        reviewerId,
        pageable
    );

    return requests.map(request -> {
      // Load tags for the document
      List<Tag> tags = documentTagLinkRepository.findByDocument_Id(request.getDocument().getId())
          .stream()
          .map(DocumentTagLink::getTag)
          .collect(Collectors.toList());
      ReviewRequestResponse response = reviewRequestMapper.toResponse(request, tags);
      
      // Generate presigned URL for document file
      Document document = request.getDocument();
      if (document.getFileKey() != null) {
        try {
          String documentFileUrl = fileStorageService.generatePresignedUrl(
              com.capstone.be.config.constant.FileStorage.DOCUMENT_FOLDER,
              document.getFileKey(),
              PRESIGNED_URL_EXPIRATION_MINUTES
          );
          response.getDocument().setFileUrl(documentFileUrl);
        } catch (Exception e) {
          log.error("Failed to generate presigned URL for document file: {}", e.getMessage());
        }
      }
      
      return response;
    });
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

    return requests.map(request -> {
      // Load tags for the document
      List<Tag> tags = documentTagLinkRepository.findByDocument_Id(request.getDocument().getId())
          .stream()
          .map(DocumentTagLink::getTag)
          .collect(Collectors.toList());
      return reviewRequestMapper.toResponse(request, tags);
    });
  }

  @Override
  @Transactional(readOnly = true)
  public Page<ReviewRequestResponse> getAllReviewRequests(Pageable pageable) {
    log.info("Getting all review requests (page: {}, size: {})", pageable.getPageNumber(), pageable.getPageSize());

    Page<ReviewRequest> requests = reviewRequestRepository.findAll(pageable);

    return requests.map(request -> {
      // Load tags for the document
      List<Tag> tags = documentTagLinkRepository.findByDocument_Id(request.getDocument().getId())
          .stream()
          .map(DocumentTagLink::getTag)
          .collect(Collectors.toList());
      return reviewRequestMapper.toResponse(request, tags);
    });
  }

  @Override
  @Transactional
  public ReviewResultResponse submitReview(UUID reviewerId, UUID reviewRequestId, SubmitReviewRequest request, MultipartFile reportFile) {
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

    // Validate report file first
    if (reportFile == null || reportFile.isEmpty()) {
      throw new InvalidRequestException("Review report file is required");
    }

    // Validate file type (accept PDF or DOCX)
    String originalFilename = reportFile.getOriginalFilename();
    if (originalFilename == null) {
      throw new InvalidRequestException("File name is required");
    }
    
    boolean isPdf = documentConversionService.isPdfFile(originalFilename);
    boolean isDocx = documentConversionService.isDocxFile(originalFilename);
    
    if (!isPdf && !isDocx) {
      throw new InvalidRequestException("Review report file must be a PDF or DOCX file");
    }

    // Check if review deadline has passed
    Instant now = Instant.now();
    if (reviewRequest.getReviewDeadline() != null && now.isAfter(reviewRequest.getReviewDeadline())) {
      log.warn("Review deadline has passed for review request {}", reviewRequestId);
      // We allow submission but log a warning
    }

    // Get document
    Document document = reviewRequest.getDocument();

    // Convert DOCX to PDF if needed, then upload to S3
    String reportFilePath;
    MultipartFile fileToUpload = reportFile;
    String pdfFilename;
    
    if (isDocx) {
      log.info("Converting DOCX to PDF: {}", originalFilename);
      try (InputStream pdfInputStream = documentConversionService.convertDocxToPdf(reportFile)) {
        // Create a new filename with .pdf extension
        String baseFilename = originalFilename.substring(0, originalFilename.lastIndexOf('.'));
        pdfFilename = String.format("review_%s_%s.pdf", reviewRequestId, baseFilename);
        
        // Create a ByteArrayMultipartFile from the converted PDF
        byte[] pdfBytes = pdfInputStream.readAllBytes();
        fileToUpload = new ByteArrayMultipartFile(
            "reportFile",
            pdfFilename,
            "application/pdf",
            pdfBytes
        );
        log.info("DOCX converted to PDF successfully: {} ({} bytes)", pdfFilename, pdfBytes.length);
      } catch (Exception e) {
        log.error("Failed to convert DOCX to PDF: {}", e.getMessage(), e);
        throw new InvalidRequestException("Failed to convert DOCX to PDF: " + e.getMessage());
      }
    } else {
      // Already PDF, use original filename
      pdfFilename = String.format("review_%s_%s", reviewRequestId, originalFilename);
    }
    
    // Upload PDF file to S3
    reportFilePath = fileStorageService.uploadFile(
        fileToUpload,
        com.capstone.be.config.constant.FileStorage.REVIEW_REPORT_FOLDER,
        pdfFilename
    );
    log.info("Uploaded review report PDF to S3: {}", reportFilePath);

    // Check if there's already a non-rejected review (PENDING or APPROVED)
    // If latest review is REJECTED by BA, allow re-submit (create new record)
    Optional<ReviewResult> latestReviewOpt = reviewResultRepository.findFirstByReviewRequest_IdOrderBySubmittedAtDesc(reviewRequestId);
    
    if (latestReviewOpt.isPresent()) {
      ReviewResult latestReview = latestReviewOpt.get();
      // Only allow re-submit if previous review was REJECTED by BA
      if (latestReview.getStatus() != ReviewResultStatus.REJECTED) {
        throw new InvalidRequestException("Review has already been submitted for this review request. Status: " + latestReview.getStatus());
      }
      log.info("Previous review {} was rejected by BA. Creating new review submission.", latestReview.getId());
    }

    // Create new ReviewResult (keep history of all submissions)
    ReviewResult reviewResult = ReviewResult.builder()
        .reviewRequest(reviewRequest)
        .document(document)
        .reviewer(reviewer)
        .comment(request.getReport())
        .reportFilePath(reportFilePath)
        .decision(request.getDecision())
        .submittedAt(now)
        .status(ReviewResultStatus.PENDING)
        .build();
    reviewResult = reviewResultRepository.save(reviewResult);

    // Document goes to PENDING_APPROVE - BA will approve/reject the review result
    document.setStatus(DocStatus.PENDING_APPROVE);
    documentRepository.save(document);

    // ReviewRequest status remains ACCEPTED (not COMPLETED)
    // It will be used to track the review process
    log.info("Review submitted. Document status changed to PENDING_APPROVE, waiting for BA approval");

    log.info("Successfully submitted review for document {}", document.getId());

    // Load tags for the document
    List<Tag> tags = documentTagLinkRepository.findByDocument_Id(document.getId())
        .stream()
        .map(DocumentTagLink::getTag)
        .collect(Collectors.toList());

    return reviewResultMapper.toResponse(reviewResult, tags);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<ReviewResultResponse> getReviewerHistory(UUID reviewerId, ReviewHistoryFilterRequest filter, Pageable pageable) {
    log.info("Getting review history for reviewer {} with filters: {}", reviewerId, filter);

    // Validate Reviewer
    User reviewer = userRepository.findById(reviewerId)
        .orElseThrow(() -> new ResourceNotFoundException("Reviewer not found with ID: " + reviewerId));

    if (reviewer.getRole() != UserRole.REVIEWER) {
      throw new InvalidRequestException("User is not a reviewer");
    }

    // Use Specification to filter
    Page<ReviewResult> reviews = reviewResultRepository.findAll(
        ReviewResultSpecification.filterReviewHistory(reviewerId, filter),
        pageable
    );

    return reviews.map(review -> {
      // Load tags for each document
      List<Tag> tags = documentTagLinkRepository.findByDocument_Id(review.getDocument().getId())
          .stream()
          .map(DocumentTagLink::getTag)
          .collect(Collectors.toList());
      
      ReviewResultResponse response = reviewResultMapper.toResponse(review, tags);

      // Generate presigned URL for report file
      if (review.getReportFilePath() != null) {
        try {
          // reportFilePath is the filename returned from uploadFile (format: review_xxx_filename.docx)
          // uploadFile returns only filename, not full path
          String filename = review.getReportFilePath();
          String reportFileUrl = fileStorageService.generatePresignedUrl(
              com.capstone.be.config.constant.FileStorage.REVIEW_REPORT_FOLDER,
              filename,
              PRESIGNED_URL_EXPIRATION_MINUTES
          );
          response.setReportFileUrl(reportFileUrl);
        } catch (Exception e) {
          log.error("Failed to generate presigned URL for report file: {}", e.getMessage(), e);
          // Continue without presigned URL
        }
      }

      // Generate presigned URL for document file
      Document document = review.getDocument();
      if (document.getFileKey() != null) {
        try {
          String documentFileUrl = fileStorageService.generatePresignedUrl(
              com.capstone.be.config.constant.FileStorage.DOCUMENT_FOLDER,
              document.getFileKey(),
              PRESIGNED_URL_EXPIRATION_MINUTES
          );
          response.getDocument().setFileUrl(documentFileUrl);
        } catch (Exception e) {
          log.error("Failed to generate presigned URL for document file: {}", e.getMessage());
        }
      }

      return response;
    });
  }

  @Override
  @Transactional(readOnly = true)
  public ReviewResultResponse getReviewResultByReviewRequestId(UUID reviewRequestId) {
    log.info("Getting document review for review request {}", reviewRequestId);

    // Get latest ReviewResult by review request ID
    ReviewResult reviewResult = reviewResultRepository.findFirstByReviewRequest_IdOrderBySubmittedAtDesc(reviewRequestId)
        .orElseThrow(() -> new ResourceNotFoundException("Document review not found for review request ID: " + reviewRequestId));

    // Load tags for the document
    List<Tag> tags = documentTagLinkRepository.findByDocument_Id(reviewResult.getDocument().getId())
        .stream()
        .map(DocumentTagLink::getTag)
        .collect(Collectors.toList());

    ReviewResultResponse response = reviewResultMapper.toResponse(reviewResult, tags);

    // Generate presigned URL for report file
    if (reviewResult.getReportFilePath() != null) {
      try {
        // reportFilePath is the filename returned from uploadFile (format: review_xxx_filename.docx)
        // uploadFile returns only filename, not full path
        String filename = reviewResult.getReportFilePath();
        String reportFileUrl = fileStorageService.generatePresignedUrl(
            com.capstone.be.config.constant.FileStorage.REVIEW_REPORT_FOLDER,
            filename,
            PRESIGNED_URL_EXPIRATION_MINUTES
        );
        response.setReportFileUrl(reportFileUrl);
        log.info("Generated presigned URL for report file: {} (filename: {})", reportFileUrl, filename);
      } catch (Exception e) {
        log.error("Failed to generate presigned URL for report file: {}", e.getMessage(), e);
        // Continue without presigned URL
      }
    }

    return response;
  }

  @Override
  @Transactional(readOnly = true)
  public Page<ReviewResultResponse> getPendingReviewResults(Pageable pageable) {
    log.info("Getting pending review results for BA approval");

    Page<ReviewResult> reviews = reviewResultRepository.findByStatus(ReviewResultStatus.PENDING, pageable);

    return reviews.map(review -> {
      List<Tag> tags = documentTagLinkRepository.findByDocument_Id(review.getDocument().getId())
          .stream()
          .map(DocumentTagLink::getTag)
          .collect(Collectors.toList());

      ReviewResultResponse response = reviewResultMapper.toResponse(review, tags);

      // Generate presigned URL for report file
      if (review.getReportFilePath() != null) {
        try {
          String filename = review.getReportFilePath();
          String reportFileUrl = fileStorageService.generatePresignedUrl(
              com.capstone.be.config.constant.FileStorage.REVIEW_REPORT_FOLDER,
              filename,
              PRESIGNED_URL_EXPIRATION_MINUTES
          );
          response.setReportFileUrl(reportFileUrl);
        } catch (Exception e) {
          log.error("Failed to generate presigned URL for report file: {}", e.getMessage());
        }
      }

      // Generate presigned URL for document file
      Document document = review.getDocument();
      if (document.getFileKey() != null) {
        try {
          String documentFileUrl = fileStorageService.generatePresignedUrl(
              com.capstone.be.config.constant.FileStorage.DOCUMENT_FOLDER,
              document.getFileKey(),
              PRESIGNED_URL_EXPIRATION_MINUTES
          );
          response.getDocument().setFileUrl(documentFileUrl);
        } catch (Exception e) {
          log.error("Failed to generate presigned URL for document file: {}", e.getMessage());
        }
      }

      return response;
    });
  }

  @Override
  @Transactional(readOnly = true)
  public Page<ReviewResultResponse> getAllReviewResults(ReviewResultStatus status, Pageable pageable) {
    log.info("Getting all review results with status filter: {}", status);

    Page<ReviewResult> reviews;
    if (status != null) {
      reviews = reviewResultRepository.findByStatus(status, pageable);
    } else {
      reviews = reviewResultRepository.findAll(pageable);
    }

    return reviews.map(review -> {
      List<Tag> tags = documentTagLinkRepository.findByDocument_Id(review.getDocument().getId())
          .stream()
          .map(DocumentTagLink::getTag)
          .collect(Collectors.toList());

      ReviewResultResponse response = reviewResultMapper.toResponse(review, tags);

      // Generate presigned URL for report file
      if (review.getReportFilePath() != null) {
        try {
          String filename = review.getReportFilePath();
          String reportFileUrl = fileStorageService.generatePresignedUrl(
              com.capstone.be.config.constant.FileStorage.REVIEW_REPORT_FOLDER,
              filename,
              PRESIGNED_URL_EXPIRATION_MINUTES
          );
          response.setReportFileUrl(reportFileUrl);
        } catch (Exception e) {
          log.error("Failed to generate presigned URL for report file: {}", e.getMessage());
        }
      }

      // Generate presigned URL for document file
      Document document = review.getDocument();
      if (document.getFileKey() != null) {
        try {
          String documentFileUrl = fileStorageService.generatePresignedUrl(
              com.capstone.be.config.constant.FileStorage.DOCUMENT_FOLDER,
              document.getFileKey(),
              PRESIGNED_URL_EXPIRATION_MINUTES
          );
          response.getDocument().setFileUrl(documentFileUrl);
        } catch (Exception e) {
          log.error("Failed to generate presigned URL for document file: {}", e.getMessage());
        }
      }

      return response;
    });
  }

  @Override
  @Transactional
  public ReviewResultResponse approveReviewResult(UUID businessAdminId, UUID reviewId, ApproveReviewResultRequest request) {
    log.info("BA {} approving/rejecting review result {}: approved={}", businessAdminId, reviewId, request.getApproved());

    // Validate Business Admin
    User businessAdmin = userRepository.findById(businessAdminId)
        .orElseThrow(() -> new ResourceNotFoundException("Business Admin not found with ID: " + businessAdminId));

    if (businessAdmin.getRole() != UserRole.BUSINESS_ADMIN) {
      throw new InvalidRequestException("Only Business Admin can approve review results");
    }

    // Get ReviewResult
    ReviewResult reviewResult = reviewResultRepository.findById(reviewId)
        .orElseThrow(() -> new ResourceNotFoundException("Document review not found with ID: " + reviewId));

    // Check if review is PENDING
    if (reviewResult.getStatus() != ReviewResultStatus.PENDING) {
      throw new InvalidRequestException("This review result has already been processed. Current status: " + reviewResult.getStatus());
    }

    Document document = reviewResult.getDocument();
    ReviewRequest reviewRequest = reviewResult.getReviewRequest();
    Instant now = Instant.now();

    if (request.getApproved()) {
      // BA approves the review result
      reviewResult.setStatus(ReviewResultStatus.APPROVED);
      reviewResult.setApprovedBy(businessAdmin);
      reviewResult.setApprovedAt(now);

      // Apply reviewer's decision to document
      if (reviewResult.getDecision() == ReviewDecision.APPROVED) {
        document.setStatus(DocStatus.ACTIVE);
        log.info("Review result approved. Document {} is now ACTIVE", document.getId());
      } else {
        document.setStatus(DocStatus.REJECTED);
        log.info("Review result approved. Document {} is now REJECTED", document.getId());
      }
    } else {
      // BA rejects the review result - reviewer must re-review
      if (request.getRejectionReason() == null || request.getRejectionReason().isBlank()) {
        throw new InvalidRequestException("Rejection reason is required when rejecting a review result");
      }

      reviewResult.setStatus(ReviewResultStatus.REJECTED);
      reviewResult.setApprovedBy(businessAdmin);
      reviewResult.setApprovedAt(now);
      reviewResult.setRejectionReason(request.getRejectionReason());

      // Document goes back to REVIEWING - reviewer must re-review
      document.setStatus(DocStatus.REVIEWING);

      // Reset review deadline for re-review (3 more days)
      Instant newReviewDeadline = calculateDeadline(now, REVIEW_DEADLINE_DAYS);
      reviewRequest.setReviewDeadline(newReviewDeadline);
      reviewRequestRepository.save(reviewRequest);

      log.info("Review result rejected. Document {} is back to REVIEWING. Reviewer must re-review by {}", 
          document.getId(), newReviewDeadline);
    }

    documentRepository.save(document);
    reviewResult = reviewResultRepository.save(reviewResult);

    // Load tags for the document
    List<Tag> tags = documentTagLinkRepository.findByDocument_Id(document.getId())
        .stream()
        .map(DocumentTagLink::getTag)
        .collect(Collectors.toList());

    ReviewResultResponse response = reviewResultMapper.toResponse(reviewResult, tags);

    // Generate presigned URL for report file
    if (reviewResult.getReportFilePath() != null) {
      try {
        String filename = reviewResult.getReportFilePath();
        String reportFileUrl = fileStorageService.generatePresignedUrl(
            com.capstone.be.config.constant.FileStorage.REVIEW_REPORT_FOLDER,
            filename,
            PRESIGNED_URL_EXPIRATION_MINUTES
        );
        response.setReportFileUrl(reportFileUrl);
      } catch (Exception e) {
        log.error("Failed to generate presigned URL for report file: {}", e.getMessage());
      }
    }

    return response;
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
