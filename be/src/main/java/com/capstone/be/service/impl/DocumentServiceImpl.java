package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.DocumentTag;
import com.capstone.be.domain.entity.ReviewInvite;
import com.capstone.be.domain.entity.Reviewer;
import com.capstone.be.dto.request.document.DocumentQueryRequest;
import com.capstone.be.dto.response.document.DocumentDetailResponse;
import com.capstone.be.dto.response.document.DocumentListResponse;
import com.capstone.be.dto.response.document.DocumentListItemResponse;
import com.capstone.be.dto.response.document.DocumentReviewerInfo;
import com.capstone.be.dto.response.document.DocumentTagInfo;
import com.capstone.be.mapper.DocumentMapper;
import com.capstone.be.repository.CommentRepository;
import com.capstone.be.repository.CoinTransactionRepository;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.DocumentReportRepository;
import com.capstone.be.repository.DocumentTagRepository;
import com.capstone.be.repository.ReviewInviteRepository;
import com.capstone.be.repository.SavedDocumentRepository;
import com.capstone.be.repository.VoteRepository;
import com.capstone.be.service.DocumentService;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeParseException;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class DocumentServiceImpl implements DocumentService {

  private final DocumentRepository documentRepository;
  private final DocumentMapper documentMapper;
  private final CommentRepository commentRepository;
  private final SavedDocumentRepository savedDocumentRepository;
  private final VoteRepository voteRepository;
  private final DocumentReportRepository documentReportRepository;
  private final CoinTransactionRepository coinTransactionRepository;
  private final DocumentTagRepository documentTagRepository;
  private final ReviewInviteRepository reviewInviteRepository;

  @Override
  @Transactional(readOnly = true)
  public DocumentDetailResponse getDetail(UUID id) {
    Document document = documentRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Document not found"));

    // Eagerly fetch relationships
    if (document.getUploader() != null) {
      document.getUploader().getFullName(); // Trigger lazy load
    }
    if (document.getOrganization() != null) {
      document.getOrganization().getName(); // Trigger lazy load
    }
    if (document.getType() != null) {
      document.getType().getName(); // Trigger lazy load
    }
    if (document.getSpecializations() != null) {
      document.getSpecializations().forEach(spec -> {
        spec.getName(); // Trigger lazy load
        if (spec.getDomain() != null) {
          spec.getDomain().getName(); // Trigger lazy load
        }
      });
    }

    DocumentDetailResponse detail = documentMapper.mapToDetailResponse(document);

    // Load statistics
    detail.setCommentCount(commentRepository.countByDocumentId(id));
    detail.setSaveCount(savedDocumentRepository.countByDocumentId(id));
    detail.setUpvoteCount(voteRepository.countUpvotesByDocumentId(id));
    detail.setDownvoteCount(voteRepository.countDownvotesByDocumentId(id));
    detail.setReportCount(documentReportRepository.countByDocumentId(id));

    // Load purchaseCount and reviewer info only if premium
    if (Boolean.TRUE.equals(document.getIsPremium())) {
      detail.setPurchaseCount(coinTransactionRepository.countByDocumentId(id));

      // Load reviewer info if document is premium and has successful review
      Optional<ReviewInvite> successfulReview = reviewInviteRepository.findSuccessfulReviewByDocumentId(id);
      if (successfulReview.isPresent()) {
        ReviewInvite reviewInvite = successfulReview.get();
        Reviewer reviewer = reviewInvite.getReviewer();
        if (reviewer != null) {
          // Trigger lazy load
          reviewer.getFullName();
          reviewer.getEmail();

          DocumentReviewerInfo reviewerInfo = DocumentReviewerInfo.builder()
              .id(reviewer.getId())
              .fullName(reviewer.getFullName())
              .username(reviewer.getUsername())
              .email(reviewer.getEmail())
              .build();
          detail.setReviewer(reviewerInfo);
        }
      }
    }

    // Load tags
    List<DocumentTag> tags = documentTagRepository.findByDocumentId(id);
    detail.setTags(tags.stream()
        .map(tag -> DocumentTagInfo.builder()
            .id(tag.getId())
            .name(null) // DocumentTag doesn't have name field
            .build())
        .collect(Collectors.toList()));

    return detail;
  }

  @Override
  @Transactional(readOnly = true)
  public DocumentListResponse query(DocumentQueryRequest request) {
    List<Document> all = documentRepository.findAll();

    // Eagerly fetch relationships for list items
    all.forEach(doc -> {
      if (doc.getUploader() != null) {
        doc.getUploader().getFullName(); // Trigger lazy load
      }
      if (doc.getOrganization() != null) {
        doc.getOrganization().getName(); // Trigger lazy load
      }
      if (doc.getType() != null) {
        doc.getType().getName(); // Trigger lazy load
      }
    });

    // Apply filters
    List<Document> filtered = all.stream()
        .filter(doc -> applyDeletedFilter(doc, request.getDeleted()))
        .filter(doc -> applySearch(doc, request.getSearch()))
        .filter(doc -> applyOrganizationFilter(doc, request.getOrganizationId()))
        .filter(doc -> applyTypeFilter(doc, request.getTypeId()))
        .filter(doc -> applyPublicFilter(doc, request.getIsPublic()))
        .filter(doc -> applyPremiumFilter(doc, request.getIsPremium()))
        .filter(doc -> applyDateRange(doc, request.getDateFrom(), request.getDateTo()))
        .collect(Collectors.toList());

    // Sort
    Comparator<Document> comparator = buildComparator(request.getSortBy());
    if (comparator != null) {
      if ("desc".equalsIgnoreCase(request.getSortOrder())) {
        comparator = comparator.reversed();
      }
      filtered = filtered.stream().sorted(comparator).collect(Collectors.toList());
    }

    // Pagination (page starts from 1)
    int page = Optional.ofNullable(request.getPage()).orElse(1);
    int limit = Optional.ofNullable(request.getLimit()).orElse(10);
    if (page < 1) {
      page = 1;
    }
    if (limit < 1) {
      limit = 10;
    }
    int fromIndex = Math.min((page - 1) * limit, filtered.size());
    int toIndex = Math.min(fromIndex + limit, filtered.size());

    List<DocumentListItemResponse> items = filtered.subList(fromIndex, toIndex).stream()
        .map(documentMapper::mapToListItemResponse)
        .collect(Collectors.toList());

    return DocumentListResponse.builder()
        .documents(items)
        .total(filtered.size())
        .page(page)
        .limit(limit)
        .build();
  }

  @Override
  @Transactional
  public void delete(UUID id) {
    Document document = documentRepository.findById(id)
        .orElseThrow(() -> new RuntimeException("Document not found"));
    document.setDeleted(true);
    document.setUpdatedAt(LocalDateTime.now());
    documentRepository.save(document);
  }

  private boolean applyDeletedFilter(Document doc, Boolean deleted) {
    if (deleted == null) {
      // Default: exclude deleted documents
      return !Boolean.TRUE.equals(doc.getDeleted());
    }
    if (deleted) {
      return Boolean.TRUE.equals(doc.getDeleted());
    } else {
      return !Boolean.TRUE.equals(doc.getDeleted());
    }
  }

  private boolean applySearch(Document doc, String search) {
    if (search == null || search.isBlank()) {
      return true;
    }
    String q = search.toLowerCase(Locale.ROOT);
    return contains(doc.getTitle(), q)
        || contains(doc.getDescription(), q)
        || contains(doc.getFile_name(), q);
  }

  private boolean contains(String field, String q) {
    return field != null && field.toLowerCase(Locale.ROOT).contains(q);
  }

  private boolean applyOrganizationFilter(Document doc, UUID organizationId) {
    if (organizationId == null) {
      return true;
    }
    return doc.getOrganization() != null && doc.getOrganization().getId().equals(organizationId);
  }

  private boolean applyTypeFilter(Document doc, UUID typeId) {
    if (typeId == null) {
      return true;
    }
    return doc.getType() != null && doc.getType().getId().equals(typeId);
  }

  private boolean applyPublicFilter(Document doc, Boolean isPublic) {
    if (isPublic == null) {
      return true;
    }
    return isPublic.equals(doc.getIsPublic());
  }

  private boolean applyPremiumFilter(Document doc, Boolean isPremium) {
    if (isPremium == null) {
      return true;
    }
    return isPremium.equals(doc.getIsPremium());
  }

  private boolean applyDateRange(Document doc, String dateFrom, String dateTo) {
    LocalDateTime createdAt = doc.getCreatedAt();
    if (createdAt == null) {
      return true;
    }
    try {
      if (dateFrom != null && !dateFrom.isBlank()) {
        LocalDate from = LocalDate.parse(dateFrom);
        if (createdAt.isBefore(from.atStartOfDay())) {
          return false;
        }
      }
      if (dateTo != null && !dateTo.isBlank()) {
        LocalDate to = LocalDate.parse(dateTo);
        LocalDateTime endOfDay = to.plusDays(1).atStartOfDay().minusNanos(1);
        return !createdAt.isAfter(endOfDay);
      }
      return true;
    } catch (DateTimeParseException e) {
      return true;
    }
  }

  private Comparator<Document> buildComparator(String sortBy) {
    if (sortBy == null || sortBy.isBlank()) {
      sortBy = "createdAt";
    }
    switch (sortBy) {
      case "title":
        return Comparator.comparing(d -> nullSafeString(d.getTitle()));
      case "viewCount":
        return Comparator.comparing(d -> d.getViewCount() != null ? d.getViewCount() : 0);
      case "createdAt":
      default:
        return Comparator.comparing(Document::getCreatedAt,
            Comparator.nullsLast(Comparator.naturalOrder()));
    }
  }

  private String nullSafeString(String v) {
    return v == null ? "" : v;
  }
}
