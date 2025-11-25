package com.capstone.be.service.impl;

import com.capstone.be.config.constant.FileStorage;
import com.capstone.be.domain.entity.DocType;
import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.DocumentReadHistory;
import com.capstone.be.domain.entity.DocumentRedemption;
import com.capstone.be.domain.entity.DocumentTagLink;
import com.capstone.be.domain.entity.OrganizationProfile;
import com.capstone.be.domain.entity.ReaderProfile;
import com.capstone.be.domain.entity.Specialization;
import com.capstone.be.domain.entity.Tag;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.OrgEnrollStatus;
import com.capstone.be.domain.enums.TagStatus;
import com.capstone.be.dto.request.document.DocumentLibraryFilter;
import com.capstone.be.dto.request.document.DocumentSearchFilter;
import com.capstone.be.dto.request.document.DocumentUploadHistoryFilter;
import com.capstone.be.dto.request.document.UpdateDocumentRequest;
import com.capstone.be.dto.request.document.UploadDocumentInfoRequest;
import com.capstone.be.dto.response.document.DocumentDetailResponse;
import com.capstone.be.dto.response.document.DocumentLibraryResponse;
import com.capstone.be.dto.response.document.DocumentPresignedUrlResponse;
import com.capstone.be.dto.response.document.DocumentReadHistoryResponse;
import com.capstone.be.dto.response.document.DocumentSearchResponse;
import com.capstone.be.dto.response.document.DocumentUploadHistoryResponse;
import com.capstone.be.dto.response.document.DocumentUploadResponse;
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
import com.capstone.be.repository.SpecializationRepository;
import com.capstone.be.repository.TagRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.repository.specification.DocumentLibrarySpecification;
import com.capstone.be.repository.specification.DocumentSearchSpecification;
import com.capstone.be.repository.specification.DocumentUploadHistorySpecification;
import com.capstone.be.service.DocumentAccessService;
import com.capstone.be.service.DocumentService;
import com.capstone.be.service.DocumentThumbnailService;
import com.capstone.be.service.FileStorageService;
import com.capstone.be.util.StringUtil;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
  private final FileStorageService fileStorageService;
  private final DocumentThumbnailService documentThumbnailService;
  private final DocumentMapper documentMapper;
  private final DocumentAccessService documentAccessService;
  private final OrgEnrollmentRepository orgEnrollmentRepository;

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
        .status(DocStatus.VERIFYING)
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

    // Fetch document with all required relationships
    Document document = documentRepository.findById(documentId)
        .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId));

    // Use mapper for base mapping
    DocumentDetailResponse response = documentMapper.toDetailResponse(document);

    // Calculate downvotes
    Integer downvoteCount = document.getUpvoteCount() - document.getVoteScore();
    response.setDownvoteCount(Math.max(0, downvoteCount));

    // Fetch and map tags
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

    // Build user-specific information if userId is provided
    if (userId != null) {
      User user = userRepository.findById(userId).orElse(null);

      boolean hasAccess = documentAccessService.hasAccess(userId, documentId);
      boolean isUploader = document.getUploader().getId().equals(userId);
      boolean hasRedeemed = false;
      if (document.getIsPremium()) {
        hasRedeemed = documentRedemptionRepository.existsByReader_IdAndDocument_Id(userId,
            documentId);
      }

      boolean isMemberOfOrganization = false;
      if (document.getOrganization() != null && user != null) {
        isMemberOfOrganization = orgEnrollmentRepository.findByOrganizationAndMember(
                document.getOrganization(), user)
            .map(enrollment -> enrollment.getStatus() == OrgEnrollStatus.JOINED)
            .orElse(false);
      }

      DocumentDetailResponse.UserDocumentInfo userInfo = DocumentDetailResponse.UserDocumentInfo.builder()
          .hasAccess(hasAccess)
          .isUploader(isUploader)
          .hasRedeemed(hasRedeemed)
          .isMemberOfOrganization(isMemberOfOrganization)
          .build();

      response.setUserInfo(userInfo);
    }

    log.info("Successfully retrieved document detail for document {}", documentId);
    return response;
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

    // Build specification based on filter
    var spec = DocumentLibrarySpecification.buildLibrarySpec(userId, filter);

    // Fetch documents with specification
    Page<Document> documentsPage = documentRepository.findAll(spec, pageable);

    // Map to response DTO
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
      DocumentRedemption redemption = documentRedemptionRepository
          .findByReader_IdAndDocument_Id(userId, document.getId())
          .orElse(null);
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

    // Fetch read history with pagination
    Page<DocumentReadHistory> historyPage = documentReadHistoryRepository.findByUser_Id(userId,
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
}
