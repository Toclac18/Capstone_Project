package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.ReaderProfile;
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
import com.capstone.be.dto.request.review.ReviewManagementFilterRequest;
import com.capstone.be.dto.request.review.SubmitReviewRequest;
import com.capstone.be.domain.enums.ReviewResultStatus;
import com.capstone.be.dto.response.review.ReviewResultResponse;
import com.capstone.be.dto.response.review.ReviewRequestResponse;
import com.capstone.be.dto.response.review.ReviewManagementItem;
import com.capstone.be.exception.InvalidRequestException;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.mapper.ReviewResultMapper;
import com.capstone.be.mapper.ReviewRequestMapper;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.ReaderProfileRepository;
import com.capstone.be.repository.ReviewResultRepository;
import com.capstone.be.repository.DocumentTagLinkRepository;
import com.capstone.be.repository.ReviewRequestRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.repository.spec.ReviewResultSpecification;
import com.capstone.be.service.DocumentConversionService;
import com.capstone.be.service.EmailService;
import com.capstone.be.service.SystemConfigService;
import com.capstone.be.service.FileStorageService;
import com.capstone.be.event.DocumentStatusChangedEvent;
import com.capstone.be.service.ReviewRequestService;
import com.capstone.be.service.helper.ReviewManagementListBuilder;
import com.capstone.be.util.ByteArrayMultipartFile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.io.InputStream;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import com.capstone.be.service.ReviewRequestQueryService;


/**
 * Thân các phương thức chuyển NGUYÊN VĂN từ ReviewRequestServiceImpl, không đổi logic.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewRequestQueryServiceImpl implements ReviewRequestQueryService {

  private static final int PRESIGNED_URL_EXPIRATION_MINUTES = 60; // 1 hour

  private final ReviewRequestRepository reviewRequestRepository;
  private final DocumentRepository documentRepository;
  private final UserRepository userRepository;
  private final ReviewResultRepository reviewResultRepository;
  private final ReviewRequestMapper reviewRequestMapper;
  private final ReviewResultMapper reviewResultMapper;
  private final FileStorageService fileStorageService;
  private final DocumentTagLinkRepository documentTagLinkRepository;
  private final ReviewManagementListBuilder listBuilder;


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
  @Transactional(readOnly = true)
  public Page<ReviewManagementItem> getReviewManagementList(ReviewManagementFilterRequest filter, Pageable pageable) {
    log.info("Getting BA review management list with filter: {}, page: {}, size: {}",
        filter, pageable.getPageNumber(), pageable.getPageSize());

    // For now, implement this using in-memory filtering based on seeded dev data.
    // This keeps logic close to existing FE behavior while we stabilise requirements.
    List<Document> allDocs = documentRepository.findAll();

    // Only consider premium documents (same as FE)
    List<Document> premiumDocs = allDocs.stream()
        .filter(d -> Boolean.TRUE.equals(d.getIsPremium()))
        .toList();

    List<ReviewManagementItem> items = new ArrayList<>();

    for (Document doc : premiumDocs) {
      // Fetch all review requests for this document
      List<ReviewRequest> docRequests = reviewRequestRepository
          .findByDocument_Id(doc.getId(), Pageable.unpaged())
          .getContent();

      // Helper to find appropriate review request depending on tab (similar to FE getReviewRequestForDocument)
      ReviewRequest chosenRequest = listBuilder.chooseReviewRequestForTab(doc, docRequests, filter.getTab());

      // Apply tab-specific inclusion logic
      if (!listBuilder.matchTab(doc, docRequests, chosenRequest, filter.getTab())) {
        continue;
      }

      // Build item
      ReviewManagementItem item = listBuilder.buildReviewManagementItem(doc, chosenRequest);
      items.add(item);
    }

    // Apply additional filters (reviewer, domain, search)
    // Wrap result in a mutable list because Stream.toList() can return an immutable list
    items = new ArrayList<>(listBuilder.applyAdditionalFilters(items, filter));

    // Apply sorting
    items.sort(listBuilder.buildComparator(filter));

    // Pagination (manual PageImpl)
    int start = (int) pageable.getOffset();
    int end = Math.min(start + pageable.getPageSize(), items.size());
    List<ReviewManagementItem> pageContent = start > end ? List.of() : items.subList(start, end);

    return new org.springframework.data.domain.PageImpl<>(pageContent, pageable, items.size());
  }
}
