package com.capstone.be.service.impl;

import com.capstone.be.config.constant.FileStorage;
import com.capstone.be.domain.entity.*;
import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.DocVisibility;
import com.capstone.be.domain.enums.OrgEnrollStatus;
import com.capstone.be.domain.enums.ReviewRequestStatus;
import com.capstone.be.domain.enums.TagStatus;
import com.capstone.be.dto.request.document.DocumentLibraryFilter;
import com.capstone.be.dto.request.document.DocumentSearchFilter;
import com.capstone.be.dto.request.document.DocumentUploadHistoryFilter;
import com.capstone.be.dto.request.document.UpdateDocumentRequest;
import com.capstone.be.dto.request.document.UploadDocumentInfoRequest;
import com.capstone.be.dto.response.document.*;
import com.capstone.be.exception.BusinessException;
import com.capstone.be.exception.ForbiddenException;
import com.capstone.be.exception.InvalidRequestException;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.mapper.DocumentMapper;
import com.capstone.be.repository.CommentRepository;
import com.capstone.be.repository.DocTypeRepository;
import com.capstone.be.repository.DocumentReadHistoryRepository;
import com.capstone.be.repository.DocumentRedemptionRepository;
import com.capstone.be.repository.DocumentReportRepository;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.DocumentTagLinkRepository;
import com.capstone.be.repository.DocumentViolationRepository;
import com.capstone.be.repository.OrgEnrollmentRepository;
import com.capstone.be.repository.OrganizationProfileRepository;
import com.capstone.be.repository.ReaderProfileRepository;
import com.capstone.be.repository.ReviewRequestRepository;
import com.capstone.be.repository.ReviewResultRepository;
import com.capstone.be.repository.SavedListDocumentRepository;
import com.capstone.be.repository.SpecializationRepository;
import com.capstone.be.repository.TagRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.repository.specification.DocumentLibrarySpecification;
import com.capstone.be.repository.specification.DocumentSearchSpecification;
import com.capstone.be.repository.specification.DocumentSpecification;
import com.capstone.be.repository.specification.DocumentUploadHistorySpecification;
import com.capstone.be.service.AiDocumentModerationAndSummarizationService;
import com.capstone.be.service.DocumentAccessService;
import com.capstone.be.service.DocumentConversionService;
import com.capstone.be.event.DocumentStatusChangedEvent;
import com.capstone.be.service.DocumentService;
import com.capstone.be.service.DocumentUploadService;
import com.capstone.be.service.DocumentThumbnailService;
import com.capstone.be.service.EmailService;
import com.capstone.be.service.FileStorageService;
import com.capstone.be.service.helper.DocumentConfigValues;
import com.capstone.be.service.helper.DocumentTagWriter;
import com.capstone.be.service.helper.NotificationHelper;
import com.capstone.be.service.SystemConfigService;
import com.capstone.be.util.StringUtil;
import com.capstone.be.dto.ai.AiModerationResponse;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import com.capstone.be.service.DocumentCommandService;
import com.capstone.be.event.DocumentStatusChangedEvent;
import org.springframework.context.ApplicationEventPublisher;

/**
 * Thân các phương thức chuyển NGUYÊN VĂN từ DocumentServiceImpl, không đổi logic.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentCommandServiceImpl implements DocumentCommandService {

  private final UserRepository userRepository;
  private final ReaderProfileRepository readerProfileRepository;
  private final OrganizationProfileRepository organizationProfileRepository;
  private final SpecializationRepository specializationRepository;
  private final DocTypeRepository docTypeRepository;
  private final DocumentRepository documentRepository;
  private final DocumentTagLinkRepository documentTagLinkRepository;
  private final DocumentRedemptionRepository documentRedemptionRepository;
  private final DocumentReadHistoryRepository documentReadHistoryRepository;
  private final FileStorageService fileStorageService;
  private final DocumentMapper documentMapper;
  private final DocumentAccessService documentAccessService;
  private final OrgEnrollmentRepository orgEnrollmentRepository;
  private final NotificationHelper notificationHelper;
  private final DocumentTagWriter documentTagWriter;
  private final DocumentConfigValues documentConfigValues;
  private final ApplicationEventPublisher events;

  @Override
  @Transactional
  public void redeemDocument(UUID userId, UUID documentId) {
    ReaderProfile reader = readerProfileRepository.findByUserId(userId).orElseThrow(
        () -> new ResourceNotFoundException("Reader not found"));
    Document document = documentRepository.findById(documentId).orElseThrow(
        () -> new ResourceNotFoundException("Document not found"));

    //Self redeem #later
    //    if (document.getUploader() == reader)

    if (documentRedemptionRepository.existsByReader_IdAndDocument_Id(reader.getId(),
        document.getId())) {
      throw new BusinessException("You already redeemed this Document");
    }

    if (!document.getIsPremium()) {
      throw new BusinessException("Cannot redeem non-premium Document");
    }

    if (reader.getPoint() < document.getPrice()) {
      throw new BusinessException("Insufficient points");
    }

    //
    DocumentRedemption redemption =
        DocumentRedemption.builder()
            .reader(reader)
            .document(document)
            .build();

    int pointsDeducted = document.getPrice();
    reader.setPoint(reader.getPoint() - pointsDeducted);
    readerProfileRepository.save(reader);

    documentRedemptionRepository.save(redemption);

    // Send notification to Reader about points deduction
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    notificationHelper.sendInfoNotification(
        user,
        "Document Redeemed",
        String.format("You redeemed '%s' for %d points. Remaining balance: %d points.",
            document.getTitle(), pointsDeducted, reader.getPoint())
    );
  }

  @Override
  @Transactional
  public DocumentPresignedUrlResponse getDocumentPresignedUrl(UUID userId, UUID documentId) {
    log.info("User {} requesting presigned URL for document {}", userId, documentId);

    // Check if document exists
    Document document = documentRepository.findById(documentId)
        .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId));

    // Check access control
    boolean hasAccess = documentAccessService.hasAccess(userId, documentId);
    if (!hasAccess) {
      log.warn("User {} does not have access to document {}", userId, documentId);
      throw new ForbiddenException("You do not have access to this document");
    }

    // Create read history record (if user is authenticated)
    if (userId != null) {
      User user = userRepository.findById(userId)
          .orElseThrow(() -> ResourceNotFoundException.userById(userId));

      // Delete old read history records for this user and document
      List<DocumentReadHistory> oldHistories = documentReadHistoryRepository.findByUser_IdAndDocument_Id(
          userId, documentId);
      if (!oldHistories.isEmpty()) {
        documentReadHistoryRepository.deleteAll(oldHistories);
        log.info("Deleted {} old read history records for user {} and document {}",
            oldHistories.size(), userId, documentId);
      }

      // Create new read history record with current timestamp
      DocumentReadHistory readHistory = DocumentReadHistory.builder()
          .user(user)
          .document(document)
          .build();
      documentReadHistoryRepository.save(readHistory);

      log.info("Created new read history for user {} and document {}", userId, documentId);
    }

    // Increment view count
    int currentViewCount = document.getViewCount() != null ? document.getViewCount() : 0;
    document.setViewCount(currentViewCount + 1);
    documentRepository.save(document);
    log.info("Incremented view count for document {} to {}", documentId, currentViewCount + 1);

    // Generate presigned URL
    Integer expirationMinutes = documentConfigValues.getPresignedUrlExpirationMinutes();
    String presignedUrl = fileStorageService.generatePresignedUrl(
        FileStorage.DOCUMENT_FOLDER,
        document.getFileKey(),
        expirationMinutes
    );

    log.info("Generated presigned URL for document {} for user {}", documentId, userId);

    return DocumentPresignedUrlResponse.builder()
        .presignedUrl(presignedUrl)
        .expiresInMinutes(expirationMinutes)
        .build();
  }

  @Override
  @Transactional
  public DocumentUploadResponse updateDocument(UUID uploaderId, UUID documentId,
      UpdateDocumentRequest request) {
    log.info("User {} updating document {}", uploaderId, documentId);

    // Fetch and verify document ownership
    Document document = documentRepository.findById(documentId)
        .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId));

    if (!document.getUploader().getId().equals(uploaderId)) {
      throw new ForbiddenException("You can only update your own documents");
    }

    // Verify user exists
    User uploader = userRepository.findById(uploaderId)
        .orElseThrow(() -> ResourceNotFoundException.userById(uploaderId));

    // Validate and fetch DocType
    DocType docType = docTypeRepository.findById(request.getDocTypeId())
        .orElseThrow(() -> new ResourceNotFoundException("DocType", "id", request.getDocTypeId()));

    // Validate and fetch Specialization
    Specialization specialization = specializationRepository.findById(request.getSpecializationId())
        .orElseThrow(() -> new ResourceNotFoundException("Specialization", "id",
            request.getSpecializationId()));

    // Validate and fetch Organization (optional)
    OrganizationProfile organization = null;
    if (request.getOrganizationId() != null) {
      organization = organizationProfileRepository.findById(request.getOrganizationId())
          .orElseThrow(() -> new ResourceNotFoundException("Organization", "id",
              request.getOrganizationId()));

      // Verify user belongs to the organization
      boolean isMember = orgEnrollmentRepository.findByOrganizationAndMember(organization, uploader)
          .map(enrollment -> enrollment.getStatus() == OrgEnrollStatus.JOINED)
          .orElse(false);

      if (!isMember) {
        throw new ForbiddenException(
            "You must be a member of the organization to assign documents to it");
      }
    }

    // Process tags
    Set<Tag> allTags = documentTagWriter.handleTags(request.getTagCodes(), request.getNewTags());

    // Update document fields
    document.setTitle(request.getTitle());
    document.setDescription(request.getDescription());
    document.setVisibility(request.getVisibility());
    document.setIsPremium(request.getIsPremium());
    document.setDocType(docType);
    document.setSpecialization(specialization);
    document.setOrganization(organization);

    // Update price based on premium status
    Integer price = Boolean.TRUE.equals(request.getIsPremium()) ? documentConfigValues.getPremiumDocPrice() : 0;
    document.setPrice(price);

    document = documentRepository.save(document);
    log.info("Updated document with ID: {}", document.getId());

    // Update document-tag relationships
    // Remove existing links
//    List<DocumentTagLink> existingLinks = documentTagLinkRepository.findByDocument_Id(
//        document.getId());
//    documentTagLinkRepository.deleteAll(existingLinks);
    documentTagLinkRepository.deleteAllByDocumentId(document.getId());

    // Save new links
    documentTagWriter.saveDocumentTagLinks(document, allTags);
    log.info("Updated {} document-tag relationships", allTags.size());

    // Build and return response using mapper
    return documentMapper.toUploadResponse(document, allTags);
  }

  @Override
  @Transactional
  public void deleteDocument(UUID uploaderId, UUID documentId) {
    log.info("User {} soft deleting document {}", uploaderId, documentId);

    // Fetch and verify document ownership
    Document document = documentRepository.findById(documentId)
        .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId));

    if (!document.getUploader().getId().equals(uploaderId)) {
      throw new ForbiddenException("You can only delete your own documents");
    }

    // Soft delete: set status to DELETED
    document.setStatus(DocStatus.DELETED);
    documentRepository.save(document);

    log.info("Soft deleted document with ID: {} (status changed to DELETED)", documentId);

    // Notify BUSINESS_ADMIN about document deletion
    notificationHelper.sendNotificationToBusinessAdmins(
        com.capstone.be.domain.enums.NotificationType.WARNING,
        "Document Deleted",
        String.format("Reader %s (%s) has deleted document: %s", 
            document.getUploader().getFullName(), 
            document.getUploader().getEmail(), 
            document.getTitle())
    );
  }

  @Override
  @Transactional
  public void activateDocument(UUID documentId) {
    log.info("Admin activating document {}", documentId);

    Document document = documentRepository.findById(documentId)
        .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId));

    document.setStatus(DocStatus.ACTIVE);
    documentRepository.save(document);

    log.info("Successfully activated document {}", documentId);

    publishStatusChanged(document, DocStatus.ACTIVE, "Activated by Business Admin");
  }

  @Override
  @Transactional
  public void deactivateDocument(UUID documentId) {
    log.info("Admin deactivating document {}", documentId);

    Document document = documentRepository.findById(documentId)
        .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId));

    document.setStatus(DocStatus.INACTIVE);
    documentRepository.save(document);

    log.info("Successfully deactivated document {}", documentId);

    publishStatusChanged(document, DocStatus.INACTIVE, "Deactivated by Business Admin");
  }

  @Override
  @Transactional
  public void updateDocumentStatus(UUID documentId, DocStatus status) {
    log.info("Admin updating document {} status to {}", documentId, status);

    Document document = documentRepository.findById(documentId)
        .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId));

    document.setStatus(status);
    documentRepository.save(document);

    log.info("Successfully updated document {} status to {}", documentId, status);

    publishStatusChanged(document, status, "Status updated by Business Admin");
  }

  /**
   * Phát event để {@link com.capstone.be.event.DocumentStatusChangedListener} gửi email
   * SAU KHI transaction commit.
   *
   * <p>Giá trị được đọc ngay ở đây, lúc còn trong transaction — event không mang entity
   * vì listener chạy sau commit, khi quan hệ lazy đã không đọc được nữa.
   */
  private void publishStatusChanged(Document document, DocStatus newStatus, String reason) {
    User uploader = document.getUploader();
    events.publishEvent(new DocumentStatusChangedEvent(
        document.getId(),
        document.getTitle(),
        uploader != null ? uploader.getEmail() : null,
        uploader != null ? uploader.getFullName() : null,
        newStatus,
        reason
    ));
  }
}
