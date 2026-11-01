package com.capstone.be.service.impl;

import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.DocVisibility;
import com.capstone.be.dto.request.document.DocumentLibraryFilter;
import com.capstone.be.dto.request.document.DocumentSearchFilter;
import com.capstone.be.dto.request.document.DocumentUploadHistoryFilter;
import com.capstone.be.dto.request.document.UpdateDocumentRequest;
import com.capstone.be.dto.request.document.UploadDocumentInfoRequest;
import com.capstone.be.dto.response.document.*;
import com.capstone.be.service.DocumentCommandService;
import com.capstone.be.service.DocumentQueryService;
import com.capstone.be.service.DocumentService;
import com.capstone.be.service.DocumentUploadService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Facade giữ nguyên {@link DocumentService} để controller không phải đổi.
 *
 * <p>Toàn bộ logic đã chuyển sang ba service theo đúng việc chúng làm:
 *
 * <ul>
 *   <li>{@link DocumentQueryService} — mọi phép đọc, tất cả readOnly
 *   <li>{@link DocumentCommandService} — mọi phép ghi
 *   <li>{@link DocumentUploadService} — luồng upload và hạ tầng riêng của nó
 * </ul>
 *
 * <p>KHÔNG đặt @Transactional ở đây: transaction boundary thuộc ba service kia, và
 * thêm một lớp nữa chỉ làm chúng lồng vào nhau mà không được gì.
 *
 * <p>Code mới nên gọi thẳng service tương ứng; facade này tồn tại để không phải sửa
 * 36 controller trong cùng một lần thay đổi. Khi controller đã chuyển hết, xoá nó.
 */
@Service
@RequiredArgsConstructor
public class DocumentServiceImpl implements DocumentService {

  private final DocumentQueryService queryService;
  private final DocumentCommandService commandService;
  private final DocumentUploadService uploadService;

  // ─────────────────────── upload ───────────────────────

  @Override
  public DocumentUploadResponse uploadDocument(
      UUID uploaderId, UploadDocumentInfoRequest request, MultipartFile file) {
    return uploadService.uploadDocument(uploaderId, request, file);
  }

  // ─────────────────────── ghi ───────────────────────

  @Override
  public void redeemDocument(UUID readerId, UUID documentId) {
    commandService.redeemDocument(readerId, documentId);
  }

  @Override
  public DocumentPresignedUrlResponse getDocumentPresignedUrl(UUID userId, UUID documentId) {
    return commandService.getDocumentPresignedUrl(userId, documentId);
  }

  @Override
  public DocumentUploadResponse updateDocument(
      UUID uploaderId, UUID documentId, UpdateDocumentRequest request) {
    return commandService.updateDocument(uploaderId, documentId, request);
  }

  @Override
  public void deleteDocument(UUID uploaderId, UUID documentId) {
    commandService.deleteDocument(uploaderId, documentId);
  }

  @Override
  public void activateDocument(UUID documentId) {
    commandService.activateDocument(documentId);
  }

  @Override
  public void deactivateDocument(UUID documentId) {
    commandService.deactivateDocument(documentId);
  }

  @Override
  public void updateDocumentStatus(UUID documentId, DocStatus status) {
    commandService.updateDocumentStatus(documentId, status);
  }

  // ─────────────────────── đọc ───────────────────────

  @Override
  public DocumentDetailResponse getDocumentDetail(UUID userId, UUID documentId) {
    return queryService.getDocumentDetail(userId, documentId);
  }

  @Override
  public Page<DocumentDetailResponse> getHomepageDocuments(UUID userId, int page, int size) {
    return queryService.getHomepageDocuments(userId, page, size);
  }

  @Override
  public Page<DocumentUploadHistoryResponse> getUploadHistory(
      UUID uploaderId, DocumentUploadHistoryFilter filter, Pageable pageable) {
    return queryService.getUploadHistory(uploaderId, filter, pageable);
  }

  @Override
  public Page<DocumentLibraryResponse> getLibrary(
      UUID userId, DocumentLibraryFilter filter, Pageable pageable) {
    return queryService.getLibrary(userId, filter, pageable);
  }

  @Override
  public Page<DocumentReadHistoryResponse> getReadHistory(UUID userId, Pageable pageable) {
    return queryService.getReadHistory(userId, pageable);
  }

  @Override
  public Page<DocumentSearchResponse> searchPublicDocuments(
      DocumentSearchFilter filter, Pageable pageable, UUID userId) {
    return queryService.searchPublicDocuments(filter, pageable, userId);
  }

  @Override
  public Page<AdminDocumentListResponse> getAllDocumentsForAdmin(
      String title, UUID uploaderId, UUID organizationId, UUID docTypeId,
      UUID specializationId, DocStatus status, DocVisibility visibility,
      Boolean isPremium, java.time.Instant dateFrom, java.time.Instant dateTo,
      Pageable pageable) {
    return queryService.getAllDocumentsForAdmin(title, uploaderId, organizationId, docTypeId,
        specializationId, status, visibility, isPremium, dateFrom, dateTo, pageable);
  }

  @Override
  public DocumentDetailResponse getDocumentDetailForAdmin(UUID documentId) {
    return queryService.getDocumentDetailForAdmin(documentId);
  }

  @Override
  public DocumentSearchMetaResponse getSearchMeta(UUID userId) {
    return queryService.getSearchMeta(userId);
  }

  @Override
  public DocumentStatisticsResponse getDocumentStatistics() {
    return queryService.getDocumentStatistics();
  }

  @Override
  public java.util.List<DocumentViolationResponse> getDocumentViolations(
      UUID userId, UUID documentId) {
    return queryService.getDocumentViolations(userId, documentId);
  }

  @Override
  public com.capstone.be.dto.response.review.ReviewResultResponse getDocumentReviewResult(
      UUID userId, UUID documentId) {
    return queryService.getDocumentReviewResult(userId, documentId);
  }
}
