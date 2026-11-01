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
import com.capstone.be.service.DocumentService;
import com.capstone.be.service.DocumentThumbnailService;
import com.capstone.be.service.EmailService;
import com.capstone.be.service.FileStorageService;
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
import com.capstone.be.service.DocumentUploadService;
import com.capstone.be.service.helper.DocumentConfigValues;

/**
 * Thân các phương thức chuyển NGUYÊN VĂN từ DocumentServiceImpl, không đổi logic.
 *
 * <p>Kèm theo là 7 phương thức riêng chỉ luồng upload dùng: validateFile, isDocxFile,
 * getUserById, getDocTypeById, getSpecializationById, getOrganizationIfProvided,
 * createDocument.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentUploadServiceImpl implements DocumentUploadService {

  private final UserRepository userRepository;
  private final OrganizationProfileRepository organizationProfileRepository;
  private final SpecializationRepository specializationRepository;
  private final DocTypeRepository docTypeRepository;
  private final DocumentRepository documentRepository;
  private final FileStorageService fileStorageService;
  private final DocumentThumbnailService documentThumbnailService;
  private final DocumentMapper documentMapper;
  private final AiDocumentModerationAndSummarizationService aiModerationService;
  private final NotificationHelper notificationHelper;
  private final DocumentConversionService documentConversionService;
  private final DocumentTagWriter documentTagWriter;
  private final DocumentConfigValues documentConfigValues;

  @Override
  @Transactional
  public DocumentUploadResponse uploadDocument(
      UUID uploaderId,
      UploadDocumentInfoRequest request,
      MultipartFile file) {
    log.info("Uploading document for user ID: {}, title: {}", uploaderId, request.getTitle());

    // Validate file
    validateFile(file);

    // Convert DOCX to PDF if needed
    MultipartFile fileToUpload = file;
    if (isDocxFile(file)) {
      log.info("Converting DOCX to PDF for document: {}", request.getTitle());
      try {
        java.io.InputStream pdfStream = documentConversionService.convertDocxToPdf(file);
        byte[] pdfBytes = pdfStream.readAllBytes();
        String originalFilename = file.getOriginalFilename();
        String pdfFilename = originalFilename != null 
            ? originalFilename.replaceAll("(?i)\\.docx$", ".pdf")
            : "document.pdf";
        fileToUpload = new com.capstone.be.util.ByteArrayMultipartFile(
            "file",
            pdfFilename,
            "application/pdf",
            pdfBytes
        );
        log.info("Successfully converted DOCX to PDF: {} -> {}", originalFilename, pdfFilename);
      } catch (Exception e) {
        log.error("Failed to convert DOCX to PDF: {}", e.getMessage(), e);
        throw new BusinessException(
            "Failed to convert DOCX to PDF: " + e.getMessage(),
            HttpStatus.BAD_REQUEST,
            "CONVERSION_FAILED"
        );
      }
    }

    // Fetch required entities
    User uploader = getUserById(uploaderId);
    DocType docType = getDocTypeById(request.getDocTypeId());
    Specialization specialization = getSpecializationById(request.getSpecializationId());
    OrganizationProfile organization = getOrganizationIfProvided(request.getOrganizationId());

    // Handle tags (existing and new)
    Set<Tag> allTags = documentTagWriter.handleTags(request.getTagCodes(), request.getNewTags());

    // Upload file to S3
    String fileKey = fileStorageService.uploadFile(fileToUpload, FileStorage.DOCUMENT_FOLDER, null);
    log.info("Uploaded document file to S3: {}", fileKey);

    // 2) Generate thumbnail từ trang đầu tiên & upload lên S3
    String thumbnailKey = documentThumbnailService.generateAndUploadThumbnail(
        fileToUpload,
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
    documentTagWriter.saveDocumentTagLinks(document, allTags);
    log.info("Saved {} document-tag relationships", allTags.size());

    // Notify BUSINESS_ADMIN if document needs reviewer assignment
    // (Documents with status VERIFYING need reviewer assignment)
    if (document.getStatus() == DocStatus.REVIEWING) {
      notificationHelper.sendNotificationToBusinessAdmins(
          com.capstone.be.domain.enums.NotificationType.INFO,
          "New Document Needs Review",
          String.format("A new document '%s' uploaded by %s needs reviewer assignment", 
              document.getTitle(), uploader.getFullName())
      );
    }

    // Notify BUSINESS_ADMIN if document needs reviewer assignment
    // (Documents with status VERIFYING need reviewer assignment)
    if (document.getStatus() == DocStatus.AI_VERIFYING) {
      notificationHelper.sendNotificationToBusinessAdmins(
          com.capstone.be.domain.enums.NotificationType.INFO,
          "New Document Needs Review",
          String.format("A new document '%s' uploaded by %s needs AI verification", 
              document.getTitle(), uploader.getFullName())
      );
    }

    // Send notification to Reader (uploader)
    notificationHelper.sendSuccessNotification(
        uploader,
        "Document Uploaded Successfully",
        String.format("Your document '%s' has been uploaded and is being processed.",
            document.getTitle())
    );

    // Trigger async AI processing (will update document status and summaries after completion)
    UUID documentId = document.getId();
    log.info("Submitting async AI processing task for document ID: {}", documentId);
    
    try {
      CompletableFuture<AiModerationResponse> aiFuture = aiModerationService.processDocumentAsync(documentId, fileToUpload);
      log.info("Async AI processing task submitted successfully for document ID: {}", documentId);
      
      aiFuture.thenAccept(aiResponse -> {
        log.info("AI processing completed for document ID: {} with status: {}",
            documentId, aiResponse != null ? aiResponse.getStatus() : "null");
      })
      .exceptionally(ex -> {
        log.error("AI processing failed for document ID: {}", documentId, ex);
        return null;
      });
    } catch (Exception e) {
      log.error("Failed to submit async AI processing task for document ID: {}", documentId, e);
      // Don't throw - document was uploaded successfully, just AI processing failed to start
    }

    // Build and return response using mapper
    return documentMapper.toUploadResponse(document, allTags);
  }

  /**
   * Validate uploaded file - allows PDF and DOCX
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
    String filename = file.getOriginalFilename();
    boolean isPdf = "application/pdf".equals(contentType) 
        || (filename != null && filename.toLowerCase().endsWith(".pdf"));
    boolean isDocx = "application/vnd.openxmlformats-officedocument.wordprocessingml.document".equals(contentType)
        || (filename != null && filename.toLowerCase().endsWith(".docx"));
    
    if (!isPdf && !isDocx) {
      throw new BusinessException(
          "Only PDF and DOCX files are allowed",
          HttpStatus.BAD_REQUEST,
          "INVALID_FILE_TYPE"
      );
    }
  }

  /**
   * Check if file is a DOCX file
   */
  private boolean isDocxFile(MultipartFile file) {
    String contentType = file.getContentType();
    String filename = file.getOriginalFilename();
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document".equals(contentType)
        || (filename != null && filename.toLowerCase().endsWith(".docx"));
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
   * Create document entity
   */
  private Document createDocument(
      UploadDocumentInfoRequest request,
      User uploader,
      DocType docType,
      Specialization specialization,
      OrganizationProfile organization,
      String fileUrl) {

    // Internal documents cannot be premium
    Boolean isPremium = request.getIsPremium();
    if (request.getVisibility() == DocVisibility.INTERNAL) {
      isPremium = false;
    }

    // Determine price: use configured premium price or 0
    Integer price = Boolean.TRUE.equals(isPremium) ? documentConfigValues.getPremiumDocPrice() : 0;

    return Document.builder()
        .title(request.getTitle())
        .description(request.getDescription())
        .uploader(uploader)
        .organization(organization)
        .visibility(request.getVisibility())
        .docType(docType)
        .isPremium(isPremium)
        .price(price)
        .fileKey(fileUrl)
        .status(DocStatus.AI_VERIFYING)
        .specialization(specialization)
        .viewCount(0)
        .upvoteCount(0)
        .voteScore(0)
        .build();
  }
}
