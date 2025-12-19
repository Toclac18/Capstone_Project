package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.DocumentSummarization;
import com.capstone.be.domain.entity.ReaderProfile;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.dto.ai.AiModerationResponse;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.ReaderProfileRepository;
import com.capstone.be.service.AiDocumentModerationAndSummarizationService;
import com.capstone.be.service.EmailService;
import com.capstone.be.service.SystemConfigService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.Collections;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * Mock implementation of AI-based document moderation and summarization service.
 * Used when USE_MOCK_AI=true to allow app to run without AI service.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@ConditionalOnProperty(name = "app.ai.useMock", havingValue = "true")
public class MockAiDocumentModerationAndSummarizationServiceImpl implements
    AiDocumentModerationAndSummarizationService {

  private final DocumentRepository documentRepository;
  private final ReaderProfileRepository readerProfileRepository;
  private final EmailService emailService;
  private final SystemConfigService systemConfigService;

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
    log.info("[MOCK AI] Starting mock AI processing for document ID: {}", documentId);

    try {
      // Simulate AI processing delay (1-2 seconds)
      Thread.sleep(1500);

      // Create mock AI response (always passes moderation)
      AiModerationResponse response = createMockAiResponse(file);

      // Update document based on mock AI response
      updateDocumentAfterAiProcessing(documentId, response);

      log.info("[MOCK AI] Successfully completed mock AI processing for document ID: {}", documentId);
      return CompletableFuture.completedFuture(response);

    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      log.error("[MOCK AI] Mock AI processing interrupted for document ID: {}", documentId, e);
      handleAiProcessingError(documentId, e);
      return CompletableFuture.failedFuture(e);
    } catch (Exception e) {
      log.error("[MOCK AI] Error during mock AI processing for document ID: {}", documentId, e);
      handleAiProcessingError(documentId, e);
      return CompletableFuture.failedFuture(e);
    }
  }

  /**
   * Create mock AI moderation response
   */
  private AiModerationResponse createMockAiResponse(MultipartFile file) {
    log.info("[MOCK AI] Generating mock AI response for file: {}", file.getOriginalFilename());

    // Create mock summaries
    AiModerationResponse.SummaryDetail shortSummary = new AiModerationResponse.SummaryDetail();
    shortSummary.setText("This is a mock short summary of the document. The document has been automatically approved by the mock AI system.");
    shortSummary.setOutputTokens(50);

    AiModerationResponse.SummaryDetail mediumSummary = new AiModerationResponse.SummaryDetail();
    mediumSummary.setText("This is a mock medium summary of the document. The document contains educational content and has been reviewed by the mock AI moderation system. All content appears to be appropriate and follows community guidelines.");
    mediumSummary.setOutputTokens(100);

    AiModerationResponse.SummaryDetail detailedSummary = new AiModerationResponse.SummaryDetail();
    detailedSummary.setText("This is a mock detailed summary of the document. The document has been thoroughly analyzed by the mock AI system. The content covers various topics in an educational manner and provides valuable information to readers. The document structure is well-organized with clear sections and appropriate formatting. No policy violations were detected during the automated moderation process.");
    detailedSummary.setOutputTokens(200);

    AiModerationResponse.Summaries summaries = new AiModerationResponse.Summaries();
    summaries.setShortSummary(shortSummary);
    summaries.setMediumSummary(mediumSummary);
    summaries.setDetailedSummary(detailedSummary);

    // Create mock timings
    AiModerationResponse.Timings timings = new AiModerationResponse.Timings();
    timings.setOcrMs(800.0);
    timings.setImageModerationMs(300.0);
    timings.setTextModerationMs(400.0);
    timings.setSummaryMs(1200.0);
    timings.setTotalMs(1500.0);

    // Build response (always pass)
    return AiModerationResponse.builder()
        .status("pass")
        .violations(Collections.emptyList())
        .summaries(summaries)
        .timings(timings)
        .build();
  }

  /**
   * Update document entity after AI processing completes
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
        log.info("[MOCK AI] Set mock AI-generated summaries for document ID: {}", documentId);
      }

      // Check if document is premium or not
      if (Boolean.TRUE.equals(document.getIsPremium())) {
        // Premium document: needs human review
        document.setStatus(DocStatus.PENDING_REVIEW);
        log.info("[MOCK AI] Premium document ID: {} passed mock AI moderation, waiting for reviewer assignment", documentId);
      } else {
        // Non-premium document: AI approval is final, set to ACTIVE
        document.setStatus(DocStatus.ACTIVE);
        log.info("[MOCK AI] Non-premium document ID: {} passed mock AI moderation, set to ACTIVE", documentId);

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
              "Your document has been approved by our mock AI moderation system. You have been awarded " + points + " points! (Mock Mode)"
          );
        } catch (Exception e) {
          log.error("[MOCK AI] Failed to send document approval email to {}: {}", uploaderEmail, e.getMessage());
        }
      }

    } else {
      // AI rejected - mark as rejected
//      document.setStatus(DocStatus.AI_REJECTED);
//      log.warn("[MOCK AI] Document ID: {} rejected by mock AI moderation. Violations: {}",
//          documentId, response.getViolations());
//
//      // Send rejection email to uploader
//      try {
//        String violationsText = response.getViolations() != null
//            ? String.join(", ", response.getViolations())
//            : "Content policy violation";
//        emailService.sendDocumentStatusUpdateEmail(
//            uploaderEmail,
//            uploaderName,
//            document.getTitle(),
//            DocStatus.AI_REJECTED,
//            "Reason: " + violationsText + " (Mock Mode)"
//        );
//      } catch (Exception e) {
//        log.error("[MOCK AI] Failed to send document rejection email to {}: {}", uploaderEmail, e.getMessage());
//      }
    }

    documentRepository.save(document);
    log.info("[MOCK AI] Updated document ID: {} with status: {}", documentId, document.getStatus());
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
        log.info("[MOCK AI] Awarded {} points to user {} for document {}. New balance: {}",
            points, uploader.getId(), documentId, readerProfile.getPoint());
      } else {
        log.warn("[MOCK AI] Reader profile not found for user {}. Cannot award points.", uploader.getId());
      }
    } catch (Exception e) {
      log.error("[MOCK AI] Failed to award points to user {}: {}", uploader.getId(), e.getMessage());
    }
  }

  /**
   * Handle errors during AI processing
   */
  @Override
  public void handleAiProcessingError(UUID documentId, Exception e) {
    try {
      Document document = documentRepository.findById(documentId).orElse(null);
      if (document != null) {
        document.setStatus(DocStatus.AI_REJECTED);
        documentRepository.save(document);
        log.error("[MOCK AI] Marked document ID: {} as AI_REJECTED due to processing error", documentId);
      }
    } catch (Exception ex) {
      log.error("[MOCK AI] Failed to update document status after AI processing error for document ID: {}",
          documentId, ex);
    }
  }
}
