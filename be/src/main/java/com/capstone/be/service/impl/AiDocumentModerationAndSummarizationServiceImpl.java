package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.DocumentSummarization;
import com.capstone.be.domain.entity.ReaderProfile;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.dto.ai.AiModerationResponse;
import com.capstone.be.exception.BusinessException;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.ReaderProfileRepository;
import com.capstone.be.service.AiDocumentModerationAndSummarizationService;
import com.capstone.be.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * Implementation of AI-based document moderation and summarization service
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AiDocumentModerationAndSummarizationServiceImpl implements
    AiDocumentModerationAndSummarizationService {

  private final DocumentRepository documentRepository;
  private final ReaderProfileRepository readerProfileRepository;
  private final EmailService emailService;
  private final RestTemplate restTemplate;

  @Value("${app.ai.moderationService.url}")
  private String aiServiceUrl;

  @Value("${app.ai.moderationService.apiKey}")
  private String aiApiKey;

  @Value("${app.document.points.ai-approval:20}")
  private int aiApprovalPoints;

  @Override
  @Async
  @Transactional
  public CompletableFuture<AiModerationResponse> processDocumentAsync(UUID documentId,
      MultipartFile file) {
    log.info("Starting async AI processing for document ID: {}", documentId);

    try {
      // Call AI service
      AiModerationResponse response = callAiModerationService(file);

      // Update document based on AI response
      updateDocumentAfterAiProcessing(documentId, response);

      log.info("Successfully completed AI processing for document ID: {}", documentId);
      return CompletableFuture.completedFuture(response);

    } catch (Exception e) {
      log.error("Error during AI processing for document ID: {}", documentId, e);
      handleAiProcessingError(documentId, e);
      return CompletableFuture.failedFuture(e);
    }
  }

  /**
   * Call external AI moderation service
   */
  private AiModerationResponse callAiModerationService(MultipartFile file) throws IOException {
    log.info("Calling AI moderation service at: {}/api/v1/process-document", aiServiceUrl);

    // Prepare multipart request
    HttpHeaders headers = new HttpHeaders();
    headers.setContentType(MediaType.MULTIPART_FORM_DATA);
    headers.set("X-API-Key", aiApiKey);
    headers.setAccept(java.util.List.of(MediaType.APPLICATION_JSON));

    // Create multipart body
    MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
    ByteArrayResource fileResource = new ByteArrayResource(file.getBytes()) {
      @Override
      public String getFilename() {
        return file.getOriginalFilename();
      }
    };
    body.add("file", fileResource);

    HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

    // Call AI service
    String url = aiServiceUrl + "/api/v1/process-document";
    ResponseEntity<AiModerationResponse> responseEntity = restTemplate.exchange(
        url,
        HttpMethod.POST,
        requestEntity,
        AiModerationResponse.class
    );

    if (!responseEntity.getStatusCode().is2xxSuccessful() || responseEntity.getBody() == null) {
      throw new BusinessException("AI moderation service returned unsuccessful response",
          HttpStatus.INTERNAL_SERVER_ERROR, "AI_SERVICE_ERROR");
    }

    log.info("AI service responded with status: {}", responseEntity.getBody().getStatus());
    return responseEntity.getBody();
  }

  /**
   * Update document entity after AI processing completes
   */
  private void updateDocumentAfterAiProcessing(UUID documentId, AiModerationResponse response) {
    Document document = documentRepository.findById(documentId)
        .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId));

    User uploader = document.getUploader();
    String uploaderEmail = uploader.getEmail();
    String uploaderName = uploader.getFullName();

    if ("pass".equalsIgnoreCase(response.getStatus())) {
      // Extract and set summaries
      if (response.getSummaries() != null) {
        DocumentSummarization summarization = DocumentSummarization.builder()
            .shortSummary(
                response.getSummaries().getShortSummary() != null
                    ? response.getSummaries().getShortSummary().getText()
                    : null
            )
            .mediumSummary(
                response.getSummaries().getMediumSummary() != null
                    ? response.getSummaries().getMediumSummary().getText()
                    : null
            )
            .detailedSummary(
                response.getSummaries().getDetailedSummary() != null
                    ? response.getSummaries().getDetailedSummary().getText()
                    : null
            )
            .build();

        document.setSummarizations(summarization);
        log.info("Set AI-generated summaries for document ID: {}", documentId);
      }

      // Check if document is premium or not
      if (Boolean.TRUE.equals(document.getIsPremium())) {
        // Premium document: needs human review
        document.setStatus(DocStatus.PENDING_REVIEW);
        log.info("Premium document ID: {} passed AI moderation, waiting for reviewer assignment", documentId);
      } else {
        // Non-premium document: AI approval is final, set to ACTIVE
        document.setStatus(DocStatus.ACTIVE);
        log.info("Non-premium document ID: {} passed AI moderation, set to ACTIVE", documentId);

        // Award points to uploader for non-premium document
        awardPointsToUploader(uploader, aiApprovalPoints, documentId);

        // Send email notification to uploader
        try {
          emailService.sendDocumentStatusUpdateEmail(
              uploaderEmail,
              uploaderName,
              document.getTitle(),
              DocStatus.ACTIVE,
              "Your document has been approved by our AI moderation system. You have been awarded " + aiApprovalPoints + " points!"
          );
        } catch (Exception e) {
          log.error("Failed to send document approval email to {}: {}", uploaderEmail, e.getMessage());
        }
      }

    } else {
      // AI rejected - mark as rejected
      document.setStatus(DocStatus.AI_REJECTED);
      log.warn("Document ID: {} rejected by AI moderation. Violations: {}",
          documentId, response.getViolations());

      // Send rejection email to uploader
      try {
        String violationsText = response.getViolations() != null 
            ? String.join(", ", response.getViolations()) 
            : "Content policy violation";
        emailService.sendDocumentStatusUpdateEmail(
            uploaderEmail,
            uploaderName,
            document.getTitle(),
            DocStatus.AI_REJECTED,
            "Reason: " + violationsText
        );
      } catch (Exception e) {
        log.error("Failed to send document rejection email to {}: {}", uploaderEmail, e.getMessage());
      }
    }

    documentRepository.save(document);
    log.info("Updated document ID: {} with status: {}", documentId, document.getStatus());
  }

  /**
   * Award points to uploader's reader profile
   */
  private void awardPointsToUploader(User uploader, int points, UUID documentId) {
    try {
      ReaderProfile readerProfile = readerProfileRepository.findByUserId(uploader.getId())
          .orElse(null);
      
      if (readerProfile != null) {
        int currentPoints = readerProfile.getPoint() != null ? readerProfile.getPoint() : 0;
        readerProfile.setPoint(currentPoints + points);
        readerProfileRepository.save(readerProfile);
        log.info("Awarded {} points to user {} for document {}. New balance: {}", 
            points, uploader.getId(), documentId, readerProfile.getPoint());
      } else {
        log.warn("Reader profile not found for user {}. Cannot award points.", uploader.getId());
      }
    } catch (Exception e) {
      log.error("Failed to award points to user {}: {}", uploader.getId(), e.getMessage());
    }
  }

  /**
   * Handle errors during AI processing
   */
  private void handleAiProcessingError(UUID documentId, Exception e) {
    try {
      Document document = documentRepository.findById(documentId).orElse(null);
      if (document != null) {
        document.setStatus(DocStatus.AI_REJECTED);
        documentRepository.save(document);
        log.error("Marked document ID: {} as AI_REJECTED due to processing error", documentId);
      }
    } catch (Exception ex) {
      log.error("Failed to update document status after AI processing error for document ID: {}",
          documentId, ex);
    }
  }
}
