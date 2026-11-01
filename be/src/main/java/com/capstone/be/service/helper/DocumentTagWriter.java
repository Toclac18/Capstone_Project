package com.capstone.be.service.helper;

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
import org.springframework.stereotype.Component;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

/**
 * Tạo và gắn tag cho document.
 *
 * <p>Tách khỏi DocumentServiceImpl: handleTags dài 133 dòng và được dùng bởi cả
 * uploadDocument lẫn updateDocument, nên nó là một mối quan tâm riêng chứ không phải
 * chi tiết nội bộ của một luồng nào.
 *
 * <p>Thân hai phương thức chuyển NGUYÊN VĂN, chỉ đổi private thành public.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DocumentTagWriter {

  private final TagRepository tagRepository;
  private final DocumentTagLinkRepository documentTagLinkRepository;
  private final NotificationHelper notificationHelper;

  /**
   * Handle existing tags and create new tags with PENDING status
   *
   * @return Set of all tags (existing + newly created)
   */
  public Set<Tag> handleTags(List<Long> tagCodes, List<String> newTags) {
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
          
          // Notify BUSINESS_ADMIN about new tags
          String tagNames = savedNewTags.stream()
              .map(Tag::getName)
              .collect(Collectors.joining(", "));
          notificationHelper.sendNotificationToBusinessAdmins(
              com.capstone.be.domain.enums.NotificationType.INFO,
              "New Tags Created",
              String.format("User has created %d new tag(s) that need approval: %s", 
                  savedNewTags.size(), tagNames)
          );
        }
      }
    }

    return allTags;
  }

  /**
   * Save document-tag relationships
   */
  public void saveDocumentTagLinks(Document document, Set<Tag> tags) {
    Set<DocumentTagLink> links = tags.stream()
        .map(tag -> DocumentTagLink.builder()
            .document(document)
            .tag(tag)
            .build())
        .collect(Collectors.toSet());

    documentTagLinkRepository.saveAll(links);
  }
}
