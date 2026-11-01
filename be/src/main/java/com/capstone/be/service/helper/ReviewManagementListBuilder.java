package com.capstone.be.service.helper;

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
import com.capstone.be.service.ReviewRequestService;
import com.capstone.be.util.ByteArrayMultipartFile;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
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
import org.springframework.stereotype.Component;

/**
 * Dựng danh sách review management cho Business Admin: chọn review request theo tab,
 * lọc, và sắp xếp.
 *
 * <p>Tách khỏi ReviewRequestServiceImpl: năm phương thức này dài 182 dòng và chỉ
 * phục vụ đúng một phương thức công khai (getReviewManagementList), nên chúng là
 * logic dựng view riêng chứ không phải nghiệp vụ review.
 *
 * <p>Thân phương thức chuyển NGUYÊN VĂN, chỉ đổi private thành public.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ReviewManagementListBuilder {

  private final ReviewResultRepository reviewResultRepository;


  /**
   * Choose representative review request for a document depending on tab.
   * This mirrors frontend logic in ReviewManagement component.
   */
  public ReviewRequest chooseReviewRequestForTab(Document doc, List<ReviewRequest> docRequests, String tab) {
    if (docRequests.isEmpty()) {
      return null;
    }

    String normalizedTab = tab != null ? tab.toUpperCase() : "ALL";
    String docIdStr = doc.getId().toString();

    if ("PENDING".equals(normalizedTab)) {
      // For pending tab, get the most recent PENDING request
      return docRequests.stream()
          .filter(r -> r.getStatus() == ReviewRequestStatus.PENDING)
          .max(Comparator.comparing(ReviewRequest::getCreatedAt))
          .orElse(null);
    } else if ("COMPLETED".equals(normalizedTab)) {
      // For completed tab, prioritize ACCEPTED requests (most recent)
      List<ReviewRequest> accepted = docRequests.stream()
          .filter(r -> r.getStatus() == ReviewRequestStatus.ACCEPTED)
          .toList();
      if (!accepted.isEmpty()) {
        return accepted.stream()
            .max(Comparator.comparing(ReviewRequest::getCreatedAt))
            .orElse(null);
      }
      // Fallback: any latest request
      return docRequests.stream()
          .max(Comparator.comparing(ReviewRequest::getCreatedAt))
          .orElse(null);
    } else {
      // For other tabs, use the latest "active" request (PENDING or ACCEPTED), else latest any
      List<ReviewRequest> active = docRequests.stream()
          .filter(r -> r.getStatus() == ReviewRequestStatus.PENDING || r.getStatus() == ReviewRequestStatus.ACCEPTED)
          .toList();
      if (!active.isEmpty()) {
        return active.stream()
            .max(Comparator.comparing(ReviewRequest::getCreatedAt))
            .orElse(null);
      }
      return docRequests.stream()
          .max(Comparator.comparing(ReviewRequest::getCreatedAt))
          .orElse(null);
    }
  }

  /**
   * Tab inclusion logic, following FE semantics.
   */
  public boolean matchTab(Document doc, List<ReviewRequest> docRequests, ReviewRequest chosenRequest, String tab) {
    String normalizedTab = tab != null ? tab.toUpperCase() : "NEEDS_ASSIGNMENT";

    if ("NEEDS_ASSIGNMENT".equals(normalizedTab)) {
      // Documents with status PENDING_REVIEW and no active review request (PENDING/ACCEPTED)
      if (doc.getStatus() != DocStatus.PENDING_REVIEW) {
        return false;
      }
      boolean hasActive = docRequests.stream().anyMatch(r ->
          r.getStatus() == ReviewRequestStatus.PENDING || r.getStatus() == ReviewRequestStatus.ACCEPTED);
      return !hasActive;
    }

    if ("PENDING".equals(normalizedTab)) {
      // Documents that have at least one PENDING review request
      return docRequests.stream().anyMatch(r -> r.getStatus() == ReviewRequestStatus.PENDING);
    }

    if ("IN_REVIEW".equals(normalizedTab)) {
      // Documents with status REVIEWING and at least one ACCEPTED review request
      if (doc.getStatus() != DocStatus.REVIEWING) {
        return false;
      }
      return docRequests.stream().anyMatch(r -> r.getStatus() == ReviewRequestStatus.ACCEPTED);
    }

    if ("COMPLETED".equals(normalizedTab)) {
      // Documents that have been reviewed (status = ACTIVE or REJECTED) and have at least one review request
      if (doc.getStatus() != DocStatus.ACTIVE && doc.getStatus() != DocStatus.REJECTED) {
        return false;
      }
      return !docRequests.isEmpty();
    }

    // "ALL" tab: include all premium documents that are in any stage of review flow
    return true;
  }

  public ReviewManagementItem buildReviewManagementItem(Document doc, ReviewRequest request) {
    ReviewManagementItem.ReviewManagementItemBuilder builder = ReviewManagementItem.builder()
        .documentId(doc.getId())
        .title(doc.getTitle())
        .documentStatus(doc.getStatus())
        .isPremium(doc.getIsPremium())
        .createdAt(doc.getCreatedAt())
        .updatedAt(doc.getUpdatedAt());

    if (doc.getSpecialization() != null && doc.getSpecialization().getDomain() != null) {
      String specName = doc.getSpecialization().getDomain().getName() + " - " + doc.getSpecialization().getName();
      builder.specializationName(specName);
    }

    if (request != null) {
      builder.reviewRequestId(request.getId())
          .reviewRequestStatus(request.getStatus())
          .responseDeadline(request.getResponseDeadline())
          .reviewDeadline(request.getReviewDeadline());

      if (request.getReviewer() != null) {
        builder.reviewerId(request.getReviewer().getId())
            .reviewerName(request.getReviewer().getFullName())
            .reviewerEmail(request.getReviewer().getEmail());
      }

      // Determine decision from latest ReviewResult if document is completed
      if (doc.getStatus() == DocStatus.ACTIVE || doc.getStatus() == DocStatus.REJECTED) {
        reviewResultRepository.findFirstByReviewRequest_IdOrderBySubmittedAtDesc(request.getId())
            .ifPresent(reviewResult -> builder.decision(reviewResult.getDecision()));
      }
    }

    return builder.build();
  }

  public List<ReviewManagementItem> applyAdditionalFilters(List<ReviewManagementItem> items, ReviewManagementFilterRequest filter) {
    return items.stream()
        .filter(item -> {
          if (filter.getReviewerId() != null) {
            if (item.getReviewerId() == null || !item.getReviewerId().equals(filter.getReviewerId())) {
              return false;
            }
          }
          if (filter.getDomain() != null && !filter.getDomain().isBlank()) {
            if (item.getSpecializationName() == null || !item.getSpecializationName().startsWith(filter.getDomain())) {
              return false;
            }
          }
          if (filter.getSearch() != null && !filter.getSearch().isBlank()) {
            String search = filter.getSearch().toLowerCase();
            String title = item.getTitle() != null ? item.getTitle().toLowerCase() : "";
            if (!title.contains(search)) {
              return false;
            }
          }
          return true;
        })
        .toList();
  }

  public Comparator<ReviewManagementItem> buildComparator(ReviewManagementFilterRequest filter) {
    String sortBy = filter.getSortBy() != null ? filter.getSortBy() : "createdAt";
    String sortOrder = filter.getSortOrder() != null ? filter.getSortOrder() : "desc";
    boolean asc = "asc".equalsIgnoreCase(sortOrder);

    Comparator<ReviewManagementItem> comparator;

    if ("title".equalsIgnoreCase(sortBy)) {
      comparator = Comparator.comparing(
          item -> item.getTitle() != null ? item.getTitle().toLowerCase() : "",
          Comparator.naturalOrder()
      );
    } else if ("deadline".equalsIgnoreCase(sortBy)) {
      // For pending: use responseDeadline; for in-review: reviewDeadline; otherwise fallback to createdAt
      comparator = Comparator.comparing((ReviewManagementItem item) -> {
        Instant deadline = item.getResponseDeadline();
        if (deadline == null) {
          deadline = item.getReviewDeadline();
        }
        if (deadline == null) {
          deadline = item.getCreatedAt();
        }
        return deadline != null ? deadline : Instant.EPOCH;
      });
    } else {
      // Default: createdAt
      comparator = Comparator.comparing((ReviewManagementItem item) ->
          item.getCreatedAt() != null ? item.getCreatedAt() : Instant.EPOCH);
    }

    if (!asc) {
      comparator = comparator.reversed();
    }

    return comparator;
  }
}
