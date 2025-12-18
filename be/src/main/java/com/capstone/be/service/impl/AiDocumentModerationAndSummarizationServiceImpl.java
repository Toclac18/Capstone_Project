package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.DocumentSummarization;
import com.capstone.be.domain.entity.DocumentViolation;
import com.capstone.be.domain.entity.ReaderProfile;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.dto.ai.AiModerationResponse;
import com.capstone.be.exception.BusinessException;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.DocumentViolationRepository;
import com.capstone.be.repository.ReaderProfileRepository;
import com.capstone.be.service.AiDocumentModerationAndSummarizationService;
import com.capstone.be.service.EmailService;
import com.capstone.be.service.SystemConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
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
 * Real implementation of AI-based document moderation and summarization service.
 * Used when USE_MOCK_AI=false (default) to call the actual AI service.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.ai.useMock", havingValue = "false", matchIfMissing = true)
public class AiDocumentModerationAndSummarizationServiceImpl implements
    AiDocumentModerationAndSummarizationService {

  private final DocumentRepository documentRepository;
  private final DocumentViolationRepository documentViolationRepository;
  private final ReaderProfileRepository readerProfileRepository;
  private final EmailService emailService;
  private final RestTemplate restTemplate;
  private final SystemConfigService systemConfigService;

  @Value("${app.ai.moderationService.url}")
  private String aiServiceUrl;

  @Value("${app.ai.moderationService.apiKey}")
  private String aiApiKey;

  @Value("${app.document.points.ai-approval:20}")
  private int aiApprovalPointsFallback;

  /**
   * Get AI approval points from SystemConfig, fallback to @Value
   */
  private int getAiApprovalPoints() {
    return systemConfigService.getIntValue("document.points.aiApproval", aiApprovalPointsFallback);
  }

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
        int points = getAiApprovalPoints();
        awardPointsToUploader(uploader, points, documentId);

        // Send email notification to uploader
        try {
          emailService.sendDocumentStatusUpdateEmail(
              uploaderEmail,
              uploaderName,
              document.getTitle(),
              DocStatus.ACTIVE,
              "Your document has been approved by our AI moderation system. You have been awarded " + points + " points!"
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

      // Save violations to database
      saveViolations(document, response);

      // Send rejection email to uploader
      try {
        String violationsText = buildViolationsEmailText(response);
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

  /**
   * Save violations to database
   */
  private void saveViolations(Document document, AiModerationResponse response) {
    if (response.getViolations() == null || response.getViolations().isEmpty()) {
      log.info("No violations to save for document ID: {}", document.getId());
      return;
    }

    try {
      for (AiModerationResponse.Violation violation : response.getViolations()) {
        DocumentViolation documentViolation = DocumentViolation.builder()
            .document(document)
            .type(violation.getType())
            .snippet(violation.getSnippet())
            .page(violation.getPage())
            .prediction(violation.getPrediction())
            .confidence(violation.getConfidence())
            .build();

        documentViolationRepository.save(documentViolation);
      }

      log.info("Saved {} violations for document ID: {}",
          response.getViolations().size(), document.getId());
    } catch (Exception e) {
      log.error("Failed to save violations for document ID: {}", document.getId(), e);
    }
  }

  /**
   * Build violations text for email notification
   */
  private String buildViolationsEmailText(AiModerationResponse response) {
    if (response.getViolations() == null || response.getViolations().isEmpty()) {
      return "Content policy violation";
    }

    StringBuilder sb = new StringBuilder();
    sb.append("Your document contains ").append(response.getViolations().size())
        .append(" violation(s):\n");

    for (int i = 0; i < response.getViolations().size(); i++) {
      AiModerationResponse.Violation v = response.getViolations().get(i);
      sb.append("\n").append(i + 1).append(". ");
      sb.append("Type: ").append(v.getType());
      sb.append(", Page: ").append(v.getPage());
      if (v.getSnippet() != null && !v.getSnippet().isEmpty()) {
        String snippet = v.getSnippet().length() > 50
            ? v.getSnippet().substring(0, 50) + "..."
            : v.getSnippet();
        sb.append(", Snippet: \"").append(snippet).append("\"");
      }
    }

    return sb.toString();
  }
}
