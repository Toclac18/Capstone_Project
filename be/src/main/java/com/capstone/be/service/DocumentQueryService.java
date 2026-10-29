package com.capstone.be.service;

import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.DocVisibility;
import com.capstone.be.dto.request.document.DocumentLibraryFilter;
import com.capstone.be.dto.request.document.DocumentSearchFilter;
import com.capstone.be.dto.request.document.DocumentUploadHistoryFilter;
import com.capstone.be.dto.request.document.UpdateDocumentRequest;
import com.capstone.be.dto.response.document.*;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Mọi phép đọc document. Tất cả phương thức đều @Transactional(readOnly = true).
 *
 * <p>Tách khỏi DocumentCommandService để một bean chỉ đọc không thể vô tình ghi,
 * và để hai nhóm có vòng đời transaction khác nhau không nằm chung một class.
 */
public interface DocumentQueryService {

  DocumentDetailResponse getDocumentDetail(UUID userId, UUID documentId);

  Page<DocumentDetailResponse> getHomepageDocuments(UUID userId, int page, int size);

  Page<DocumentUploadHistoryResponse> getUploadHistory(UUID uploaderId,
      DocumentUploadHistoryFilter filter, Pageable pageable);

  Page<DocumentLibraryResponse> getLibrary(UUID userId, DocumentLibraryFilter filter,
      Pageable pageable);

  Page<DocumentReadHistoryResponse> getReadHistory(UUID userId, Pageable pageable);

  Page<DocumentSearchResponse> searchPublicDocuments(DocumentSearchFilter filter,
      Pageable pageable, UUID userId);

  Page<AdminDocumentListResponse> getAllDocumentsForAdmin(
      String title, UUID uploaderId, UUID organizationId, UUID docTypeId,
      UUID specializationId, DocStatus status, DocVisibility visibility,
      Boolean isPremium, java.time.Instant dateFrom, java.time.Instant dateTo,
      Pageable pageable);

  DocumentDetailResponse getDocumentDetailForAdmin(UUID documentId);

  DocumentSearchMetaResponse getSearchMeta(UUID userId);

  DocumentStatisticsResponse getDocumentStatistics();

  java.util.List<DocumentViolationResponse> getDocumentViolations(UUID userId, UUID documentId);

  com.capstone.be.dto.response.review.ReviewResultResponse getDocumentReviewResult(
      UUID userId, UUID documentId);
}
