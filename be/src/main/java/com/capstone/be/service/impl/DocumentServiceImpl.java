package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.DocType;
import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.DocumentRedemption;
import com.capstone.be.domain.entity.DocumentTagLink;
import com.capstone.be.domain.entity.OrganizationProfile;
import com.capstone.be.domain.entity.ReaderProfile;
import com.capstone.be.domain.entity.Specialization;
import com.capstone.be.domain.entity.Tag;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.TagStatus;
import com.capstone.be.dto.request.document.UploadDocumentInfoRequest;
import com.capstone.be.dto.response.document.DocumentUploadResponse;
import com.capstone.be.exception.BusinessException;
import com.capstone.be.exception.InvalidRequestException;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.mapper.DocumentMapper;
import com.capstone.be.repository.DocTypeRepository;
import com.capstone.be.repository.DocumentRedemptionRepository;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.DocumentTagLinkRepository;
import com.capstone.be.repository.OrganizationProfileRepository;
import com.capstone.be.repository.ReaderProfileRepository;
import com.capstone.be.repository.SpecializationRepository;
import com.capstone.be.repository.TagRepository;
import com.capstone.be.repository.UserRepository;
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
  private final FileStorageService fileStorageService;
  private final DocumentThumbnailService documentThumbnailService;
  private final DocumentMapper documentMapper;

  @Value("${app.premium-doc-price:100}")
  private Integer premiumDocPrice;

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
    Set<Tag> allTags = handleTags(request);

    // Upload file to S3
    String fileUrl = fileStorageService.uploadFile(file, "documents", null);
    log.info("Uploaded document file to S3: {}", fileUrl);

    // 2) Generate thumbnail từ trang đầu tiên & upload lên S3
    String thumbnailUrl = documentThumbnailService.generateAndUploadThumbnail(
        file,
        "public/document-thumbnail"
    );
    if (thumbnailUrl != null) {
      log.info("Generated thumbnail for document: {}", thumbnailUrl);
    } else {
      log.warn("Thumbnail generation returned null. Document will be saved without thumbnail.");
    }

    // Create and save document
    Document document = createDocument(request, uploader, docType, specialization, organization,
        fileUrl);
    if (thumbnailUrl != null) {
      document.setThumbnail(thumbnailUrl);
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
   * @param request Upload request containing tag codes and new tag names
   * @return Set of all tags (existing + newly created)
   */
  private Set<Tag> handleTags(UploadDocumentInfoRequest request) {
    Set<Tag> allTags = new HashSet<>();

    // ===== 1. Handle existing tags by codes =====
    if (request.getTagCodes() != null && !request.getTagCodes().isEmpty()) {
      List<Long> tagCodes = request.getTagCodes();

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
    if (request.getNewTags() != null && !request.getNewTags().isEmpty()) {
      // Map normalizedName -> originalName (keep original name for display)
      Map<String, String> normalizedToOriginal = new HashMap<>();

      for (String rawName : request.getNewTags()) {
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
        Set<String> existedNormalizedNames = existingTags.stream()
            .map(Tag::getNormalizedName)
            .collect(Collectors.toSet());

        // Create new tags for names that do not exist
        List<Tag> tagsToCreate = new ArrayList<>();
        for (Map.Entry<String, String> entry : normalizedToOriginal.entrySet()) {
          String normalized = entry.getKey();
          String originalName = entry.getValue();

          if (existedNormalizedNames.contains(normalized)) {
            log.warn("Tag with name '{}' already exists (normalized: '{}'), skipping creation",
                originalName, normalized);
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
        .fileName(fileUrl)
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
    for (Tag tag : tags) {
      DocumentTagLink link = DocumentTagLink.builder()
          .document(document)
          .tag(tag)
          .build();
      documentTagLinkRepository.save(link);
    }
  }
}
