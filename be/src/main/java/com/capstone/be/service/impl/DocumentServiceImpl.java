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
import com.capstone.be.repository.DocTypeRepository;
import com.capstone.be.repository.DocumentReadHistoryRepository;
import com.capstone.be.repository.DocumentRedemptionRepository;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.DocumentTagLinkRepository;
import com.capstone.be.repository.OrgEnrollmentRepository;
import com.capstone.be.repository.OrganizationProfileRepository;
import com.capstone.be.repository.ReaderProfileRepository;
import com.capstone.be.repository.ReviewRequestRepository;
import com.capstone.be.repository.SpecializationRepository;
import com.capstone.be.repository.TagRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.repository.specification.DocumentLibrarySpecification;
import com.capstone.be.repository.specification.DocumentSearchSpecification;
import com.capstone.be.repository.specification.DocumentSpecification;
import com.capstone.be.repository.specification.DocumentUploadHistorySpecification;
import com.capstone.be.service.AiDocumentModerationAndSummarizationService;
import com.capstone.be.service.DocumentAccessService;
import com.capstone.be.service.DocumentService;
import com.capstone.be.service.DocumentThumbnailService;
import com.capstone.be.service.EmailService;
import com.capstone.be.service.FileStorageService;
import com.capstone.be.util.StringUtil;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
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

/**
 * Implementation of DocumentService for document management
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentServiceImpl implements DocumentService {

  private final UserRepository userRepository;
  private final ReaderProfileRepository readerProfileRepository;
  private final OrganizationProfileRepository organizationProfileRepository;
  private final SpecializationRepository specializationRepository;
  private final DocTypeRepository docTypeRepository;
  private final TagRepository tagRepository;
  private final DocumentRepository documentRepository;
  private final DocumentTagLinkRepository documentTagLinkRepository;
  private final DocumentRedemptionRepository documentRedemptionRepository;
  private final DocumentReadHistoryRepository documentReadHistoryRepository;
  private final ReviewRequestRepository reviewRequestRepository;
  private final com.capstone.be.repository.ReviewResultRepository reviewResultRepository;
  private final com.capstone.be.repository.CommentRepository commentRepository;
  private final com.capstone.be.repository.SavedListDocumentRepository savedListDocumentRepository;
  private final com.capstone.be.repository.DocumentReportRepository documentReportRepository;
  private final FileStorageService fileStorageService;
  private final DocumentThumbnailService documentThumbnailService;
  private final DocumentMapper documentMapper;
  private final DocumentAccessService documentAccessService;
  private final OrgEnrollmentRepository orgEnrollmentRepository;
  private final AiDocumentModerationAndSummarizationService aiModerationService;
  private final EmailService emailService;

  @Value("${app.document.defaultPremiumPrice:120}")
  private Integer premiumDocPrice;

  @Value("${app.s3.document.presignedExpInMinutes:60}")
  private Integer presignedUrlExpirationMinutes;

  @Override
  @Transactional
  public DocumentUploadResponse uploadDocument(
      UUID uploaderId,
      UploadDocumentInfoRequest request,
      MultipartFile file) {
    log.info("Uploading document for user ID: {}, title: {}", uploaderId, request.getTitle());

    // Validate file
    validateFile(file);

    // Fetch required entities
    User uploader = getUserById(uploaderId);
    DocType docType = getDocTypeById(request.getDocTypeId());
    Specialization specialization = getSpecializationById(request.getSpecializationId());
    OrganizationProfile organization = getOrganizationIfProvided(request.getOrganizationId());

    // Handle tags (existing and new)
    Set<Tag> allTags = handleTags(request.getTagCodes(), request.getNewTags());

    // Upload file to S3
    String fileKey = fileStorageService.uploadFile(file, FileStorage.DOCUMENT_FOLDER, null);
    log.info("Uploaded document file to S3: {}", fileKey);

    // 2) Generate thumbnail từ trang đầu tiên & upload lên S3
    String thumbnailKey = documentThumbnailService.generateAndUploadThumbnail(
        file,
        FileStorage.DOCUMENT_THUMB_FOLDER
    );
    if (thumbnailKey != null) {
      log.info("Generated thumbnail for document: {}", thumbnailKey);
    } else {
      log.warn("Thumbnail generation returned null. Document will be saved without thumbnail.");
    }

    // Create and save document
    Document document = createDocument(request, uploader, docType, specialization, organization,
        fileKey);
    if (thumbnailKey != null) {
      document.setThumbnailKey(thumbnailKey);
    }

    document = documentRepository.save(document);
    log.info("Created document with ID: {}", document.getId());

    // Save document-tag relationships
    saveDocumentTagLinks(document, allTags);
    log.info("Saved {} document-tag relationships", allTags.size());

    // Trigger async AI processing (will update document status and summaries after completion)
    UUID documentId = document.getId();
    aiModerationService.processDocumentAsync(documentId, file)
        .thenAccept(aiResponse -> {
          log.info("AI processing completed for document ID: {} with status: {}",
              documentId, aiResponse.getStatus());
        })
        .exceptionally(ex -> {
          log.error("AI processing failed for document ID: {}", documentId, ex);
          return null;
        });

    // Build and return response using mapper
    return documentMapper.toUploadResponse(document, allTags);
  }

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

    reader.setPoint(reader.getPoint() - document.getPrice());
    readerProfileRepository.save(reader);

    documentRedemptionRepository.save(redemption);
  }

  /**
   * Validate uploaded file
   */
  private void validateFile(MultipartFile file) {
    if (file == null || file.isEmpty()) {
      throw new BusinessException(
          "Document file is required",
          HttpStatus.BAD_REQUEST,
          "FILE_REQUIRED"
      );
    }

    String contentType = file.getContentType();
    if (contentType == null || !contentType.equals("application/pdf")) {
      throw new BusinessException(
          "Only PDF files are allowed",
          HttpStatus.BAD_REQUEST,
          "INVALID_FILE_TYPE"
      );
    }
  }

  /**
   * Get user by ID or throw exception
   */
  private User getUserById(UUID userId) {
    return userRepository.findById(userId)
        .orElseThrow(() -> ResourceNotFoundException.userById(userId));
  }

  /**
   * Get document type by ID or throw exception
   */
  private DocType getDocTypeById(UUID docTypeId) {
    return docTypeRepository.findById(docTypeId)
        .orElseThrow(() -> new ResourceNotFoundException(
            "Document type", "id", docTypeId));
  }

  /**
   * Get specialization by ID or throw exception
   */
  private Specialization getSpecializationById(UUID specializationId) {
    return specializationRepository.findById(specializationId)
        .orElseThrow(() -> new ResourceNotFoundException(
            "Specialization", "id", specializationId));
  }

  /**
   * Get organization by ID if provided, otherwise return null
   */
  private OrganizationProfile getOrganizationIfProvided(UUID organizationId) {
    if (organizationId == null) {
      return null;
    }
    return organizationProfileRepository.findById(organizationId)
        .orElseThrow(() -> new ResourceNotFoundException(
            "Organization", "id", organizationId));
  }

  /**
   * Handle existing tags and create new tags with PENDING status
   *
   * @return Set of all tags (existing + newly created)
   */
  private Set<Tag> handleTags(List<Long> tagCodes, List<String> newTags) {
    Set<Tag> allTags = new HashSet<>();

    // ===== 1. Handle existing tags by codes =====
    if (tagCodes != null && !tagCodes.isEmpty()) {

      // Fetch all ACTIVE tags by code (single query)
      Set<Tag> existingTags = tagRepository.findAllByStatusAndCodeIn(TagStatus.ACTIVE, tagCodes);

      // Extract actual existing codes
      Set<Long> existingCodes = existingTags.stream()
          .map(Tag::getCode)
          .collect(Collectors.toSet());

      // If any requested code is missing → invalid
      if (existingCodes.size() < tagCodes.size()) {
        List<Long> invalidTagCodes = tagCodes.stream()
            .filter(code -> !existingCodes.contains(code))
            .toList();

        throw new InvalidRequestException(
            "Invalid tag codes: " + invalidTagCodes,
            "INVALID_TAG"
        );
      }

      allTags.addAll(existingTags);
      log.info("Found {} existing active tags", existingTags.size());
    }

    // ===== 2. Handle new tags (by name) =====
    if (newTags != null && !newTags.isEmpty()) {
      // Validate new tag names
      java.util.regex.Pattern validTagPattern = java.util.regex.Pattern.compile("^[\\p{L}\\p{N}\\s\\-]+$");
      
      for (String rawName : newTags) {
        if (rawName != null && !rawName.trim().isEmpty()) {
          String trimmedName = rawName.trim();
          if (trimmedName.length() > 50) {
            throw new InvalidRequestException(
                "Tag name must not exceed 50 characters: " + trimmedName,
                "INVALID_TAG_NAME"
            );
          }
          if (!validTagPattern.matcher(trimmedName).matches()) {
            throw new InvalidRequestException(
                "Tag name can only contain letters, numbers, spaces, and hyphens: " + trimmedName,
                "INVALID_TAG_NAME"
            );
          }
        }
      }
      
      // Map normalizedName -> originalName (keep original name for display)
      Map<String, String> normalizedToOriginal = new HashMap<>();

      for (String rawName : newTags) {
        if (rawName == null) {
          continue;
        }
        String trimmedName = rawName.trim();
        if (trimmedName.isEmpty()) {
          continue;
        }

        String normalized = StringUtil.normalize(trimmedName);
        if (normalized.isEmpty()) {
          continue;
        }

        // If duplicate normalized name within the same request → keep the first one
        normalizedToOriginal.putIfAbsent(normalized, trimmedName);
      }

      if (!normalizedToOriginal.isEmpty()) {
        Set<String> normalizedNames = normalizedToOriginal.keySet();

        // Find existing tags by normalizedName (single query)
        Set<Tag> existingTags = tagRepository.findAllByNormalizedNameIn(normalizedNames);

        Map<String, Tag> existinTagMap = existingTags.stream()
            .collect(Collectors.toMap(Tag::getNormalizedName, tag -> tag));

        // Create new tags for names that do not exist
        List<Tag> tagsToCreate = new ArrayList<>();
        for (Map.Entry<String, String> entry : normalizedToOriginal.entrySet()) {
          String normalized = entry.getKey();
          String originalName = entry.getValue();

          if (existinTagMap.containsKey(normalized)) {
            log.warn("Tag with name '{}' already exists (normalized: '{}'), skipping creation",
                originalName, normalized);

            //Add to result
            allTags.add(existinTagMap.get(normalized));
            continue;
          }

          Tag newTag = Tag.builder()
              .name(originalName)
              .normalizedName(normalized)
              .status(TagStatus.PENDING) // waiting for admin approval
              .build();

          tagsToCreate.add(newTag);
        }

        if (!tagsToCreate.isEmpty()) {
          List<Tag> savedNewTags = tagRepository.saveAll(tagsToCreate);
          allTags.addAll(savedNewTags);
          log.info("Created {} new tags with PENDING status for admin approval",
              savedNewTags.size());
        }
      }
    }

    return allTags;
  }

  /**
   * Create document entity
   */
  private Document createDocument(
      UploadDocumentInfoRequest request,
      User uploader,
      DocType docType,
      Specialization specialization,
      OrganizationProfile organization,
      String fileUrl) {

    // Determine price: use configured premium price or 0
    Integer price = Boolean.TRUE.equals(request.getIsPremium()) ? premiumDocPrice : 0;

    return Document.builder()
        .title(request.getTitle())
        .description(request.getDescription())
        .uploader(uploader)
        .organization(organization)
        .visibility(request.getVisibility())
        .docType(docType)
        .isPremium(request.getIsPremium())
        .price(price)
        .fileKey(fileUrl)
        .status(DocStatus.AI_VERIFYING)
        .specialization(specialization)
        .viewCount(0)
        .upvoteCount(0)
        .voteScore(0)
        .build();
  }

  /**
   * Save document-tag relationships
   */
  private void saveDocumentTagLinks(Document document, Set<Tag> tags) {
    Set<DocumentTagLink> links = tags.stream()
        .map(tag -> DocumentTagLink.builder()
            .document(document)
            .tag(tag)
            .build())
        .collect(Collectors.toSet());

    documentTagLinkRepository.saveAll(links);
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
    String presignedUrl = fileStorageService.generatePresignedUrl(
        FileStorage.DOCUMENT_FOLDER,
        document.getFileKey(),
        presignedUrlExpirationMinutes
    );

    log.info("Generated presigned URL for document {} for user {}", documentId, userId);

    return DocumentPresignedUrlResponse.builder()
        .presignedUrl(presignedUrl)
        .expiresInMinutes(presignedUrlExpirationMinutes)
        .build();
  }

  @Override
  @Transactional(readOnly = true)
  public DocumentDetailResponse getDocumentDetail(UUID userId, UUID documentId) {
    log.info("User {} requesting document detail for document {}", userId, documentId);

    Document document = documentRepository.findById(documentId)
            .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId));

    DocumentDetailResponse response = mapDocumentToDetailResponse(document, userId);

    log.info("Successfully retrieved document detail for document {}", documentId);
    return response;
  }

  @Override
  @Transactional(readOnly = true)
  public Page<DocumentDetailResponse> getHomepageDocuments(UUID userId, int page, int size) {
    // 1. Tạo Pageable
    Pageable pageable = PageRequest.of(
            page,
            size,
            Sort.by(Sort.Direction.DESC, "voteScore", "createdAt")
    );

    // 2. Query DB: Lấy bài Public & Verified
    Page<Document> documentPage = documentRepository.findByStatusAndVisibility(
            DocStatus.ACTIVE,
            DocVisibility.PUBLIC,
            pageable
    );

    // 3. Map sang DTO (truyền userId vào để xử lý logic Guest/User)
    return documentPage.map(doc -> mapDocumentToDetailResponse(doc, userId));
  }

  @Override
  @Transactional(readOnly = true)
  public Page<DocumentUploadHistoryResponse> getUploadHistory(UUID uploaderId,
      DocumentUploadHistoryFilter filter, Pageable pageable) {
    log.info("User {} requesting upload history with filter: {} and pagination: {}",
        uploaderId, filter, pageable);

    // Verify user exists
    if (!userRepository.existsById(uploaderId)) {
      throw ResourceNotFoundException.userById(uploaderId);
    }

    // Build specification with filter
    Specification<Document> spec = DocumentUploadHistorySpecification.buildUploadHistorySpec(
        uploaderId, filter);

    // Fetch documents with specification and pagination
    Page<Document> documentsPage = documentRepository.findAll(spec, pageable);

    // Map to response DTO
    Page<DocumentUploadHistoryResponse> responsePage = documentsPage.map(document -> {
      DocumentUploadHistoryResponse response = documentMapper.toUploadHistoryResponse(document);

      // Get redemption count for this document
      if (document.getIsPremium()) {
        long redemptionCount = documentRedemptionRepository.countByDocument_Id(document.getId());
        response.setRedemptionCount((int) redemptionCount);
      }

      return response;
    });

    log.info("Retrieved {} documents for user {} (page {}/{})",
        responsePage.getNumberOfElements(),
        uploaderId,
        responsePage.getNumber() + 1,
        responsePage.getTotalPages());

    return responsePage;
  }

  @Override
  @Transactional(readOnly = true)
  public Page<DocumentLibraryResponse> getLibrary(UUID userId, DocumentLibraryFilter filter,
      Pageable pageable) {
    log.info("User {} requesting library with filter: {}, pagination: {}", userId, filter,
        pageable);

    // Verify user exists
    if (!userRepository.existsById(userId)) {
      throw ResourceNotFoundException.userById(userId);
    }

    // Get reader profile ID for redemption queries
    ReaderProfile readerProfile = readerProfileRepository.findByUserId(userId).orElse(null);
    UUID readerProfileId = readerProfile != null ? readerProfile.getId() : null;

    // Build specification based on filter - use userId for owned docs, readerProfileId for purchased
    var spec = DocumentLibrarySpecification.buildLibrarySpec(userId, readerProfileId, filter);

    // Fetch documents with specification
    Page<Document> documentsPage = documentRepository.findAll(spec, pageable);

    // Map to response DTO
    final UUID finalReaderProfileId = readerProfileId;
    Page<DocumentLibraryResponse> responsePage = documentsPage.map(document -> {
      DocumentLibraryResponse response = documentMapper.toLibraryResponse(document);

      // Get tags for this document
      List<DocumentTagLink> tagLinks = documentTagLinkRepository.findByDocument(document);
      List<String> tagNames = tagLinks.stream()
          .map(link -> link.getTag().getName())
          .sorted()
          .toList();
      response.setTagNames(tagNames);

      // Build user relation info
      boolean isOwned = document.getUploader().getId().equals(userId);
      DocumentRedemption redemption = finalReaderProfileId != null 
          ? documentRedemptionRepository.findByReader_IdAndDocument_Id(finalReaderProfileId, document.getId()).orElse(null)
          : null;
      boolean isPurchased = redemption != null;

      DocumentLibraryResponse.UserRelationInfo userRelation = DocumentLibraryResponse.UserRelationInfo.builder()
          .isOwned(isOwned)
          .isPurchased(isPurchased)
          .purchasedAt(isPurchased ? redemption.getCreatedAt() : null)
          .build();

      response.setUserRelation(userRelation);

      return response;
    });

    log.info("Retrieved {} documents for user {} library (page {}/{})",
        responsePage.getNumberOfElements(),
        userId,
        responsePage.getNumber() + 1,
        responsePage.getTotalPages());

    return responsePage;
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
    Set<Tag> allTags = handleTags(request.getTagCodes(), request.getNewTags());

    // Update document fields
    document.setTitle(request.getTitle());
    document.setDescription(request.getDescription());
    document.setVisibility(request.getVisibility());
    document.setIsPremium(request.getIsPremium());
    document.setDocType(docType);
    document.setSpecialization(specialization);
    document.setOrganization(organization);

    // Update price based on premium status
    Integer price = Boolean.TRUE.equals(request.getIsPremium()) ? premiumDocPrice : 0;
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
    saveDocumentTagLinks(document, allTags);
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
  }

  @Override
  @Transactional(readOnly = true)
  public Page<DocumentReadHistoryResponse> getReadHistory(UUID userId, Pageable pageable) {
    log.info("User {} requesting read history with pagination: {}", userId, pageable);

    // Verify user exists
    if (!userRepository.existsById(userId)) {
      throw ResourceNotFoundException.userById(userId);
    }

    // Fetch read history with pagination, ordered by most recent first
    Page<DocumentReadHistory> historyPage = documentReadHistoryRepository.findByUser_IdOrderByCreatedAtDesc(userId,
        pageable);

    // Map to response DTO
    Page<DocumentReadHistoryResponse> responsePage = historyPage.map(history -> {
      Document document = history.getDocument();

      // Fetch tags for this document
      List<DocumentTagLink> tagLinks = documentTagLinkRepository.findByDocument_Id(
          document.getId());
      List<String> tagNames = tagLinks.stream()
          .map(link -> link.getTag().getName())
          .sorted()
          .toList();

      // Build document info
      DocumentReadHistoryResponse.DocumentInfo documentInfo = DocumentReadHistoryResponse.DocumentInfo.builder()
          .id(document.getId())
          .title(document.getTitle())
          .description(document.getDescription())
          .isPremium(document.getIsPremium())
          .thumbnailUrl(document.getThumbnailKey())
          .docTypeName(document.getDocType().getName())
          .specializationName(document.getSpecialization().getName())
          .domainName(document.getSpecialization().getDomain().getName())
          .tagNames(tagNames)
          .uploader(DocumentReadHistoryResponse.UploaderInfo.builder()
              .id(document.getUploader().getId())
              .fullName(document.getUploader().getFullName())
              .avatarUrl(document.getUploader().getAvatarKey())
              .build())
          .build();

      return DocumentReadHistoryResponse.builder()
          .id(history.getId())
          .readAt(history.getCreatedAt())
          .document(documentInfo)
          .build();
    });

    log.info("Retrieved {} read history records for user {} (page {}/{})",
        responsePage.getNumberOfElements(),
        userId,
        responsePage.getNumber() + 1,
        responsePage.getTotalPages());

    return responsePage;
  }

  @Override
  @Transactional(readOnly = true)
  public Page<DocumentSearchResponse> searchPublicDocuments(DocumentSearchFilter filter,
      Pageable pageable) {
    log.info("Searching public documents with filter: {} and pagination: {}", filter, pageable);

    // Build specification for public documents only
    Specification<Document> spec = DocumentSearchSpecification.buildSearchSpec(filter);

    // Fetch documents with specification and pagination
    Page<Document> documentsPage = documentRepository.findAll(spec, pageable);

    // Map to response DTO
    Page<DocumentSearchResponse> responsePage = documentsPage.map(document -> {
      // Fetch tags for this document
      List<DocumentTagLink> tagLinks = documentTagLinkRepository.findByDocument_Id(
          document.getId());
      List<String> tagNames = tagLinks.stream()
          .map(link -> link.getTag().getName())
          .sorted()
          .toList();

      // Build organization info (if exists)
      DocumentSearchResponse.OrganizationInfo orgInfo = null;
      if (document.getOrganization() != null) {
        orgInfo = DocumentSearchResponse.OrganizationInfo.builder()
            .id(document.getOrganization().getId())
            .name(document.getOrganization().getName())
            .logoUrl(document.getOrganization().getLogoKey())
            .build();
      }

      // Build uploader info
      DocumentSearchResponse.UploaderInfo uploaderInfo = DocumentSearchResponse.UploaderInfo.builder()
          .id(document.getUploader().getId())
          .fullName(document.getUploader().getFullName())
          .avatarUrl(document.getUploader().getAvatarKey())
          .build();

      //Build summarization infor
      DocumentDetailResponse.SummarizationInfo summarizations = null;
      if (document.getSummarizations() != null) {
        var s = document.getSummarizations();

        summarizations = DocumentDetailResponse.SummarizationInfo.builder()
                .shortSummary(s.getShortSummary())
                .mediumSummary(s.getMediumSummary())
                .detailedSummary(s.getDetailedSummary())
                .build();
      }

      return DocumentSearchResponse.builder()
          .id(document.getId())
          .title(document.getTitle())
          .description(document.getDescription())
          .isPremium(document.getIsPremium())
          .price(document.getPrice())
          .thumbnailUrl(document.getThumbnailKey())
          .createdAt(document.getCreatedAt())
          .viewCount(document.getViewCount())
          .upvoteCount(document.getUpvoteCount())
          .voteScore(document.getVoteScore())
          .docTypeName(document.getDocType().getName())
          .specializationName(document.getSpecialization().getName())
          .domainName(document.getSpecialization().getDomain().getName())
              .summarizations(summarizations)
          .tagNames(tagNames)
          .organization(orgInfo)
          .uploader(uploaderInfo)
          .build();
    });

    log.info("Found {} public documents (page {}/{})",
        responsePage.getNumberOfElements(),
        responsePage.getNumber() + 1,
        responsePage.getTotalPages());

    return responsePage;
  }

  // ===== Admin-only methods implementation =====

  @Override
  @Transactional(readOnly = true)
  public Page<AdminDocumentListResponse> getAllDocumentsForAdmin(
      String title,
      UUID uploaderId,
      UUID organizationId,
      UUID docTypeId,
      UUID specializationId,
      DocStatus status,
      DocVisibility visibility,
      Boolean isPremium,
      java.time.Instant dateFrom,
      java.time.Instant dateTo,
      Pageable pageable) {
    log.info(
        "Admin fetching documents - title: {}, uploaderId: {}, organizationId: {}, docTypeId: {}, "
            + "specializationId: {}, status: {}, visibility: {}, isPremium: {}, dateFrom: {}, dateTo: {}, page: {}, size: {}",
        title, uploaderId, organizationId, docTypeId, specializationId, status, visibility,
        isPremium, dateFrom, dateTo, pageable.getPageNumber(), pageable.getPageSize());

    Specification<Document> spec = DocumentSpecification.withFilters(
        title, uploaderId, organizationId, docTypeId, specializationId, status, visibility,
        isPremium, dateFrom, dateTo);

    Page<Document> documentPage = documentRepository.findAll(spec, pageable);
    
    log.info("Found {} documents (total: {})", documentPage.getNumberOfElements(), documentPage.getTotalElements());

    return documentPage.map(document -> {
      try {
        AdminDocumentListResponse response = documentMapper.toAdminListResponse(document);
        
        if (response == null) {
          log.warn("Mapper returned null for document {}", document.getId());
          return null;
        }
        
        // Add linked information
        UUID documentId = document.getId();
      
      // Comment count
      long commentCount = commentRepository.countByDocumentIdAndNotDeleted(documentId);
      response.setCommentCount(commentCount);
      
      // Save count (saved list documents)
      long saveCount = savedListDocumentRepository.countByDocument_Id(documentId);
      response.setSaveCount(saveCount);
      
      // Report count
      long reportCount = documentReportRepository.countByDocument_Id(documentId);
      response.setReportCount(reportCount);
      
      // Purchase count (only for premium documents)
      if (Boolean.TRUE.equals(document.getIsPremium())) {
        long purchaseCount = documentRedemptionRepository.countByDocument_Id(documentId);
        response.setPurchaseCount(purchaseCount);
      }
      
      // Review status (only for premium documents)
      if (Boolean.TRUE.equals(document.getIsPremium())) {
        AdminDocumentListResponse.ReviewStatusInfo reviewStatus = AdminDocumentListResponse.ReviewStatusInfo.builder()
            .pendingCount((int) reviewRequestRepository.countByDocument_IdAndStatus(documentId, ReviewRequestStatus.PENDING))
            .acceptedCount((int) reviewRequestRepository.countByDocument_IdAndStatus(documentId, ReviewRequestStatus.ACCEPTED))
            .submittedReviewCount((int) reviewResultRepository.countByReviewRequest_Document_IdAndSubmittedAtIsNotNull(documentId))
            .rejectedCount((int) reviewRequestRepository.countByDocument_IdAndStatus(documentId, ReviewRequestStatus.REJECTED))
            .expiredCount((int) reviewRequestRepository.countByDocument_IdAndStatus(documentId, ReviewRequestStatus.EXPIRED))
            .hasActiveReview(
                reviewRequestRepository.countByDocument_IdAndStatus(documentId, ReviewRequestStatus.PENDING) > 0 ||
                reviewRequestRepository.countByDocument_IdAndStatus(documentId, ReviewRequestStatus.ACCEPTED) > 0
            )
            .build();
        response.setReviewStatus(reviewStatus);
      }
      
      return response;
    } catch (Exception e) {
      log.error("Error mapping document {} to AdminDocumentListResponse: {}", document.getId(), e.getMessage(), e);
      throw e; // Re-throw to see the actual error
    }
    });
  }

  @Override
  @Transactional(readOnly = true)
  public DocumentDetailResponse getDocumentDetailForAdmin(UUID documentId) {
    log.info("Admin requesting document detail for document {}", documentId);

    Document document = documentRepository.findById(documentId)
        .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId));

    DocumentDetailResponse response = documentMapper.toDetailResponse(document);

    Integer downvoteCount = document.getUpvoteCount() - document.getVoteScore();
    response.setDownvoteCount(Math.max(0, downvoteCount));

    List<DocumentTagLink> tagLinks = documentTagLinkRepository.findByDocument(document);
    List<DocumentDetailResponse.TagInfo> tagInfos = tagLinks.stream()
        .map(link -> {
          Tag tag = link.getTag();
          return DocumentDetailResponse.TagInfo.builder()
              .id(tag.getId())
              .code(tag.getCode())
              .name(tag.getName())
              .build();
        })
        .toList();
    response.setTags(tagInfos);
    
    // Populate admin-specific information
    DocumentDetailResponse.AdminInfo adminInfo = DocumentDetailResponse.AdminInfo.builder()
        .commentCount(commentRepository.countByDocumentIdAndNotDeleted(documentId))
        .saveCount(savedListDocumentRepository.countByDocument_Id(documentId))
        .reportCount(documentReportRepository.countByDocument_Id(documentId))
        .build();
    
    // Purchase count (only for premium documents)
    if (Boolean.TRUE.equals(document.getIsPremium())) {
      adminInfo.setPurchaseCount(documentRedemptionRepository.countByDocument_Id(documentId));
      
      // Review request summary
      DocumentDetailResponse.ReviewRequestSummary reviewSummary = DocumentDetailResponse.ReviewRequestSummary.builder()
          .pendingCount((int) reviewRequestRepository.countByDocument_IdAndStatus(documentId, ReviewRequestStatus.PENDING))
          .acceptedCount((int) reviewRequestRepository.countByDocument_IdAndStatus(documentId, ReviewRequestStatus.ACCEPTED))
          .submittedReviewCount((int) reviewResultRepository.countByReviewRequest_Document_IdAndSubmittedAtIsNotNull(documentId))
          .rejectedCount((int) reviewRequestRepository.countByDocument_IdAndStatus(documentId, ReviewRequestStatus.REJECTED))
          .expiredCount((int) reviewRequestRepository.countByDocument_IdAndStatus(documentId, ReviewRequestStatus.EXPIRED))
          .hasActiveReview(
              reviewRequestRepository.countByDocument_IdAndStatus(documentId, ReviewRequestStatus.PENDING) > 0 ||
              reviewRequestRepository.countByDocument_IdAndStatus(documentId, ReviewRequestStatus.ACCEPTED) > 0
          )
          .build();
      adminInfo.setReviewRequestSummary(reviewSummary);
      
      // Review requests list (limit to 10 most recent)
      Page<ReviewRequest> reviewRequestsPage = reviewRequestRepository.findByDocument_Id(
          documentId, PageRequest.of(0, 10));
      List<DocumentDetailResponse.ReviewRequestInfo> reviewRequestInfos = reviewRequestsPage.getContent().stream()
          .map(rr -> DocumentDetailResponse.ReviewRequestInfo.builder()
              .id(rr.getId())
              .reviewer(DocumentDetailResponse.ReviewerInfo.builder()
                  .id(rr.getReviewer().getId())
                  .email(rr.getReviewer().getEmail())
                  .fullName(rr.getReviewer().getFullName())
                  .build())
              .assignedBy(DocumentDetailResponse.AssignedByInfo.builder()
                  .id(rr.getAssignedBy().getId())
                  .email(rr.getAssignedBy().getEmail())
                  .fullName(rr.getAssignedBy().getFullName())
                  .build())
              .status(rr.getStatus())
              .responseDeadline(rr.getResponseDeadline())
              .reviewDeadline(rr.getReviewDeadline())
              .respondedAt(rr.getRespondedAt())
              .rejectionReason(rr.getRejectionReason())
              .note(rr.getNote())
              .createdAt(rr.getCreatedAt())
              .build())
          .toList();
      adminInfo.setReviewRequests(reviewRequestInfos);
    }
    
    // Recent reports (limit to 10 most recent)
    Page<DocumentReport> reportsPage = documentReportRepository.findByDocumentId(
        documentId, PageRequest.of(0, 10));
    List<DocumentDetailResponse.ReportInfo> reportInfos = reportsPage.getContent().stream()
        .map(report -> DocumentDetailResponse.ReportInfo.builder()
            .id(report.getId())
            .reporter(DocumentDetailResponse.ReporterInfo.builder()
                .id(report.getReporter().getId())
                .email(report.getReporter().getEmail())
                .fullName(report.getReporter().getFullName())
                .build())
            .reason(report.getReason())
            .description(report.getDescription())
            .status(report.getStatus())
            .adminNotes(report.getAdminNotes())
            .createdAt(report.getCreatedAt())
            .build())
        .toList();
    adminInfo.setReports(reportInfos);
    
    response.setAdminInfo(adminInfo);

    log.info("Successfully retrieved document detail for admin for document {}", documentId);
    return response;
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

    notifyDocumentOwnerStatusChange(document, DocStatus.ACTIVE, "Activated by Business Admin");
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

    notifyDocumentOwnerStatusChange(document, DocStatus.INACTIVE, "Deactivated by Business Admin");
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

    notifyDocumentOwnerStatusChange(document, status, "Status updated by Business Admin");
  }

  /**
   * Notify document uploader about status changes.
   * This is a best-effort notification and should not break business flow.
   */
  private void notifyDocumentOwnerStatusChange(Document document, DocStatus newStatus, String reason) {
    try {
      User uploader = document.getUploader();
      if (uploader == null || uploader.getEmail() == null) {
        return;
      }

      emailService.sendDocumentStatusUpdateEmail(
          uploader.getEmail(),
          uploader.getFullName(),
          document.getTitle(),
          newStatus,
          reason
      );
    } catch (Exception e) {
      log.warn("Failed to send document status update email for document {}: {}", document.getId(), e.getMessage());
    }
  }

  private DocumentDetailResponse mapDocumentToDetailResponse(Document document, UUID userId) {
    DocumentDetailResponse response = documentMapper.toDetailResponse(document);

    // 2. Calculate downvotes
    Integer downvoteCount = document.getUpvoteCount() - document.getVoteScore();
    response.setDownvoteCount(Math.max(0, downvoteCount));

    // 3. Fetch tags
    List<DocumentTagLink> tagLinks = documentTagLinkRepository.findByDocument(document);
    List<DocumentDetailResponse.TagInfo> tagInfos = tagLinks.stream()
            .map(link -> DocumentDetailResponse.TagInfo.builder()
                    .id(link.getTag().getId())
                    .code(link.getTag().getCode())
                    .name(link.getTag().getName())
                    .build())
            .toList();
    response.setTags(tagInfos);

    DocumentDetailResponse.UserDocumentInfo userInfo;

    if (userId != null) {
      // Check access (includes all access types: public, uploader, org member, redeemed, reviewer)
      boolean hasAccess = documentAccessService.hasAccess(userId, document.getId());

      boolean isUploader = document.getUploader() != null && document.getUploader().getId().equals(userId);

      boolean hasRedeemed = false;
      if (Boolean.TRUE.equals(document.getIsPremium())) {
        // Find ReaderProfile from User ID first, then check redemption
        ReaderProfile readerProfile = readerProfileRepository.findByUserId(userId).orElse(null);
        if (readerProfile != null) {
          hasRedeemed = documentRedemptionRepository
                  .existsByReader_IdAndDocument_Id(readerProfile.getId(), document.getId());
        }
      }

      boolean isMemberOfOrganization = false;
      if (document.getOrganization() != null) {
        User user = userRepository.findById(userId).orElse(null);
        if (user != null) {
          isMemberOfOrganization = orgEnrollmentRepository
                  .findByOrganizationAndMember(document.getOrganization(), user)
                  .map(enrollment -> enrollment.getStatus() == OrgEnrollStatus.JOINED)
                  .orElse(false);
        }
      }

      // Check if user is assigned reviewer with ACCEPTED status
      boolean isReviewer = reviewRequestRepository
              .findByDocument_IdAndReviewer_Id(document.getId(), userId)
              .map(reviewRequest -> reviewRequest.getStatus() == ReviewRequestStatus.ACCEPTED)
              .orElse(false);

      // Add presigned URL if user has access
      String presignedUrl = null;
      if (hasAccess && document.getFileKey() != null) {
        presignedUrl = fileStorageService.generatePresignedUrl(
                FileStorage.DOCUMENT_FOLDER,
                document.getFileKey(),
                presignedUrlExpirationMinutes
        );
      }
      response.setPresignedUrl(presignedUrl);

      userInfo = DocumentDetailResponse.UserDocumentInfo.builder()
              .hasAccess(hasAccess)
              .isUploader(isUploader)
              .hasRedeemed(hasRedeemed)
              .isMemberOfOrganization(isMemberOfOrganization)
              .isReviewer(isReviewer)
              .build();

    } else {
      boolean hasAccess = false;
      if (!Boolean.TRUE.equals(document.getIsPremium())) {
        hasAccess = true;
      }

      // Add presigned URL if guest has access (non-premium documents)
      String presignedUrl = null;
      if (hasAccess && document.getFileKey() != null) {
        presignedUrl = fileStorageService.generatePresignedUrl(
                FileStorage.DOCUMENT_FOLDER,
                document.getFileKey(),
                presignedUrlExpirationMinutes
        );
      }
      response.setPresignedUrl(presignedUrl);

      userInfo = DocumentDetailResponse.UserDocumentInfo.builder()
              .hasAccess(hasAccess)
              .isUploader(false)
              .hasRedeemed(false)
              .isMemberOfOrganization(false)
              .isReviewer(false)
              .build();
    }

    // Set vào response
    response.setUserInfo(userInfo);

    return response;
  }

  @Override
  @Transactional(readOnly = true)
  public DocumentSearchMetaResponse getPublicSearchMeta() {
    log.info("Building search meta for public documents");

    // Organizations
    List<OrganizationProfile> orgEntities =
            documentRepository.findOrganizationsForPublicSearch();

    List<DocumentSearchMetaResponse.OrganizationOption> orgOptions = orgEntities.stream()
            .filter(Objects::nonNull)
            .map(org -> DocumentSearchMetaResponse.OrganizationOption.builder()
                    .id(org.getId())
                    .name(org.getName())
                    .logoUrl(org.getLogoKey())
                    .docCount(null) // nếu muốn có docCount, cần query riêng
                    .build())
            .sorted(Comparator.comparing(DocumentSearchMetaResponse.OrganizationOption::getName,
                    String.CASE_INSENSITIVE_ORDER))
            .collect(Collectors.toList());

    // Domains
    List<Domain> domainEntities = documentRepository.findDomainsForPublicSearch();
    List<DocumentSearchMetaResponse.DomainOption> domainOptions = domainEntities.stream()
            .filter(Objects::nonNull)
            .map(domain -> DocumentSearchMetaResponse.DomainOption.builder()
                    .id(domain.getId())
                    .code(domain.getCode())
                    .name(domain.getName())
                    .docCount(null)
                    .build())
            .sorted(Comparator.comparing(DocumentSearchMetaResponse.DomainOption::getName,
                    String.CASE_INSENSITIVE_ORDER))
            .collect(Collectors.toList());

    // Specializations
    List<Specialization> specEntities =
            documentRepository.findSpecializationsForPublicSearch();
    List<DocumentSearchMetaResponse.SpecializationOption> specOptions = specEntities.stream()
            .filter(Objects::nonNull)
            .map(spec -> DocumentSearchMetaResponse.SpecializationOption.builder()
                    .id(spec.getId())
                    .code(spec.getCode())
                    .name(spec.getName())
                    .domainId(spec.getDomain() != null ? spec.getDomain().getId() : null)
                    .docCount(null)
                    .build())
            .sorted(Comparator.comparing(DocumentSearchMetaResponse.SpecializationOption::getName,
                    String.CASE_INSENSITIVE_ORDER))
            .collect(Collectors.toList());

    // DocTypes
    List<DocType> docTypeEntities = documentRepository.findDocTypesForPublicSearch();
    List<DocumentSearchMetaResponse.DocTypeOption> docTypeOptions = docTypeEntities.stream()
            .filter(Objects::nonNull)
            .map(dt -> DocumentSearchMetaResponse.DocTypeOption.builder()
                    .id(dt.getId())
                    .code(dt.getCode())
                    .name(dt.getName())
                    .docCount(null)
                    .build())
            .sorted(Comparator.comparing(DocumentSearchMetaResponse.DocTypeOption::getName,
                    String.CASE_INSENSITIVE_ORDER))
            .collect(Collectors.toList());

    // Tags
    List<Tag> tagEntities = documentRepository.findTagsForPublicSearch();
    List<DocumentSearchMetaResponse.TagOption> tagOptions = tagEntities.stream()
            .filter(Objects::nonNull)
            .map(tag -> DocumentSearchMetaResponse.TagOption.builder()
                    .id(tag.getId())
                    .name(tag.getName())
                    .docCount(null)
                    .build())
            .sorted(Comparator.comparing(DocumentSearchMetaResponse.TagOption::getName,
                    String.CASE_INSENSITIVE_ORDER))
            .collect(Collectors.toList());

    // Years
    List<Integer> years = documentRepository.findYearsForPublicSearch();

    // Price/points range
    Integer minPrice = documentRepository.findMinPremiumPriceForPublicSearch();
    Integer maxPrice = documentRepository.findMaxPremiumPriceForPublicSearch();

    DocumentSearchMetaResponse.RangeDto priceRange = DocumentSearchMetaResponse.RangeDto.builder()
            .min(minPrice)
            .max(maxPrice)
            .build();

    return DocumentSearchMetaResponse.builder()
            .organizations(orgOptions)
            .domains(domainOptions)
            .specializations(specOptions)
            .docTypes(docTypeOptions)
            .tags(tagOptions)
            .years(years)
            .priceRange(priceRange)
            .build();
  }
  
  @Override
  @Transactional(readOnly = true)
  public com.capstone.be.dto.response.document.DocumentStatisticsResponse getDocumentStatistics() {
    log.info("Calculating document statistics for admin");
    
    // Total counts
    long totalDocuments = documentRepository.count();
    long totalActiveDocuments = documentRepository.count(
        DocumentSpecification.withFilters(null, null, null, null, null, DocStatus.ACTIVE, null, null, null, null));
    long totalPremiumDocuments = documentRepository.count(
        DocumentSpecification.withFilters(null, null, null, null, null, null, null, true, null, null));
    long totalPublicDocuments = documentRepository.count(
        DocumentSpecification.withFilters(null, null, null, null, null, null, DocVisibility.PUBLIC, null, null, null));
    
    // Status breakdown
    Map<String, Long> statusBreakdown = new java.util.HashMap<>();
    for (DocStatus status : DocStatus.values()) {
      long count = documentRepository.count(
          DocumentSpecification.withFilters(null, null, null, null, null, status, null, null, null, null));
      statusBreakdown.put(status.name(), count);
    }
    
    // Visibility breakdown
    Map<String, Long> visibilityBreakdown = new java.util.HashMap<>();
    for (DocVisibility visibility : DocVisibility.values()) {
      long count = documentRepository.count(
          DocumentSpecification.withFilters(null, null, null, null, null, null, visibility, null, null, null));
      visibilityBreakdown.put(visibility.name(), count);
    }
    
    // Engagement metrics - aggregate from all documents
    List<Document> allDocuments = documentRepository.findAll();
    long totalViews = allDocuments.stream()
        .mapToLong(doc -> doc.getViewCount() != null ? doc.getViewCount() : 0L)
        .sum();
    long totalVotes = allDocuments.stream()
        .mapToLong(doc -> doc.getUpvoteCount() != null ? doc.getUpvoteCount() : 0L)
        .sum();
    
    // Count from repositories
    long totalComments = commentRepository.count();
    long totalSaves = savedListDocumentRepository.count();
    long totalReports = documentReportRepository.count();
    long totalPurchases = documentRedemptionRepository.count();
    
    // Review metrics - count all review requests by status
    List<ReviewRequest> allReviewRequests = reviewRequestRepository.findAll();
    long pendingReviewRequests = allReviewRequests.stream()
        .filter(rr -> rr.getStatus() == ReviewRequestStatus.PENDING)
        .count();
    long acceptedReviewRequests = allReviewRequests.stream()
        .filter(rr -> rr.getStatus() == ReviewRequestStatus.ACCEPTED)
        .count();
    long submittedReviews = reviewResultRepository.countBySubmittedAtIsNotNull();
    long totalReviewRequests = allReviewRequests.size();
    
    // Recent activity (last 30 days)
    Instant thirtyDaysAgo = Instant.now().minusSeconds(30 * 24 * 60 * 60);
    long documentsUploadedLast30Days = allDocuments.stream()
        .filter(doc -> doc.getCreatedAt() != null && doc.getCreatedAt().isAfter(thirtyDaysAgo))
        .count();
    long documentsActivatedLast30Days = allDocuments.stream()
        .filter(doc -> doc.getStatus() == DocStatus.ACTIVE 
            && doc.getUpdatedAt() != null 
            && doc.getUpdatedAt().isAfter(thirtyDaysAgo))
        .count();
    
    return com.capstone.be.dto.response.document.DocumentStatisticsResponse.builder()
        .totalDocuments(totalDocuments)
        .totalActiveDocuments(totalActiveDocuments)
        .totalPremiumDocuments(totalPremiumDocuments)
        .totalPublicDocuments(totalPublicDocuments)
        .statusBreakdown(statusBreakdown)
        .visibilityBreakdown(visibilityBreakdown)
        .totalViews(totalViews)
        .totalComments(totalComments)
        .totalSaves(totalSaves)
        .totalVotes(totalVotes)
        .totalReports(totalReports)
        .totalPurchases(totalPurchases)
        .totalReviewRequests(totalReviewRequests)
        .pendingReviewRequests(pendingReviewRequests)
        .acceptedReviewRequests(acceptedReviewRequests)
        .submittedReviews(submittedReviews)
        .documentsUploadedLast30Days(documentsUploadedLast30Days)
        .documentsActivatedLast30Days(documentsActivatedLast30Days)
        .build();
  }

}
