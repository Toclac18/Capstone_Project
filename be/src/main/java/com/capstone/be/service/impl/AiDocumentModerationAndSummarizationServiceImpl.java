package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.AiProcessingJob;
import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.DocumentSummarization;
import com.capstone.be.domain.entity.DocumentViolation;
import com.capstone.be.domain.entity.ReaderProfile;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.AiJobStatus;
import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.dto.ai.AiModerationResponse;
import com.capstone.be.exception.BusinessException;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.repository.AiProcessingJobRepository;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.DocumentViolationRepository;
import com.capstone.be.repository.ReaderProfileRepository;
import com.capstone.be.service.AiDocumentModerationAndSummarizationService;
import com.capstone.be.service.EmailService;
import com.capstone.be.service.SystemConfigService;
import com.capstone.be.dto.ai.JobSubmitResponse;
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
import org.springframework.web.util.UriComponentsBuilder;

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
  private final AiProcessingJobRepository aiProcessingJobRepository;

  @Value("${app.ai.moderationService.url}")
  private String aiServiceUrl;

  @Value("${app.ai.moderationService.apiKey:}")
  private String aiApiKey;

  @Value("${app.backend.baseUrl:http://localhost:8080}")
  private String backendBaseUrl;

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
    String filename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown";
    long fileSizeBytes = file.getSize();
    double fileSizeMB = fileSizeBytes / (1024.0 * 1024.0);
    String threadName = Thread.currentThread().getName();
    
    log.info("========================================");
    log.info("🚀 Starting async AI processing");
    log.info("   Document ID: {}", documentId);
    log.info("   File name: {}", filename);
    log.info("   File size: {:.2f} MB ({} bytes)", fileSizeMB, fileSizeBytes);
    log.info("   Thread: {}", threadName);
    log.info("========================================");

    try {
      // Submit job to AI service with webhook callback
      JobSubmitResponse jobResponse = submitJobToAiService(documentId, file);

      // Save job to database
      saveJobToDatabase(documentId, jobResponse.getJobId(), file.getOriginalFilename());

      log.info("Job {} submitted for document ID: {}. Waiting for webhook callback.", 
          jobResponse.getJobId(), documentId);
      
      // Return null for now - actual result will come via webhook
      // The CompletableFuture will be completed when webhook is received
      return new CompletableFuture<>(); // Will be completed by webhook handler

    } catch (Exception e) {
      log.error("Error submitting job to AI service for document ID: {}", documentId, e);
      handleAiProcessingError(documentId, e);
      return CompletableFuture.failedFuture(e);
    }
  }

  /**
   * Submit job to AI service with webhook callback
   */
  private JobSubmitResponse submitJobToAiService(UUID documentId, MultipartFile file) 
      throws IOException {
    String filename = file.getOriginalFilename() != null ? file.getOriginalFilename() : "unknown";
    long fileSizeBytes = file.getSize();
    double fileSizeMB = fileSizeBytes / (1024.0 * 1024.0);
    
    log.info("========================================");
    log.info("📤 Submitting job to AI service");
    log.info("   Document ID: {}", documentId);
    log.info("   File name: {}", filename);
    log.info("   File size: {:.2f} MB ({} bytes)", fileSizeMB, fileSizeBytes);
    log.info("   AI Service URL: {}/api/v1/process-document", aiServiceUrl);
    log.info("========================================");

    // Build webhook callback URL
    String callbackUrl = backendBaseUrl + "/api/v1/ai/webhook";

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

    // Build URL with callback_url as query parameter using UriComponentsBuilder
    String url = UriComponentsBuilder.fromHttpUrl(aiServiceUrl)
        .path("/api/v1/process-document")
        .queryParam("callback_url", callbackUrl)
        .toUriString();

    HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, headers);

    // Call AI service
    ResponseEntity<JobSubmitResponse> responseEntity = restTemplate.exchange(
        url,
        HttpMethod.POST,
        requestEntity,
        JobSubmitResponse.class
    );

    if (!responseEntity.getStatusCode().is2xxSuccessful() || responseEntity.getBody() == null) {
      throw new BusinessException("AI moderation service returned unsuccessful response",
          HttpStatus.INTERNAL_SERVER_ERROR, "AI_SERVICE_ERROR");
    }

    JobSubmitResponse jobResponse = responseEntity.getBody();
    if (jobResponse.getJobId() == null || jobResponse.getJobId().isEmpty()) {
      log.error("AI service returned job response without job_id. Response: {}", jobResponse);
      throw new BusinessException("AI service returned invalid response: missing job_id",
          HttpStatus.INTERNAL_SERVER_ERROR, "AI_SERVICE_ERROR");
    }

    log.info("========================================");
    log.info("✓ Job submitted successfully to AI service");
    log.info("   Job ID: {}", jobResponse.getJobId());
    log.info("   Status: {}", jobResponse.getStatus());
    log.info("   Message: {}", jobResponse.getMessage());
    log.info("========================================");
    return jobResponse;
  }

  /**
   * Save job to database
   */
  private void saveJobToDatabase(UUID documentId, String jobId, String filename) {
    try {
      if (jobId == null || jobId.isEmpty()) {
        log.error("Cannot save job to database: jobId is null or empty for document {}", documentId);
        return;
      }

      Document document = documentRepository.findById(documentId)
          .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId));

      AiProcessingJob job = AiProcessingJob.builder()
          .document(document)
          .jobId(jobId)
          .status(AiJobStatus.PENDING)
          .filename(filename)
          .callbackUrl(backendBaseUrl + "/api/v1/ai/webhook")
          .build();

      aiProcessingJobRepository.save(job);
      log.info("Saved AI processing job {} for document {}", jobId, documentId);
    } catch (Exception e) {
      log.error("Failed to save AI processing job to database: {}", e.getMessage(), e);
      // Don't throw - job was submitted successfully, just DB save failed
    }
  }

  /**
   * Update document entity after AI processing completes
   * Made public so webhook controller can call it
   */
  @Override
  public void updateDocumentAfterAiProcessing(UUID documentId, AiModerationResponse response) {
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
   * Made public so webhook controller can call it
   */
  @Override
  public void handleAiProcessingError(UUID documentId, Exception e) {
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
