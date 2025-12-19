package com.capstone.be.controller;

import com.capstone.be.domain.entity.AiProcessingJob;
import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.enums.AiJobStatus;
import com.capstone.be.dto.ai.WebhookPayload;
import com.capstone.be.repository.AiProcessingJobRepository;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.service.AiDocumentModerationAndSummarizationService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Controller to receive webhook callbacks from AI service
 */
@Slf4j
@RestController
@RequestMapping("/v1/ai")  // Relative to servlet path /api, so full path is /api/v1/ai
@RequiredArgsConstructor
public class AiWebhookController {

  private final AiProcessingJobRepository aiProcessingJobRepository;
  private final DocumentRepository documentRepository;
  private final AiDocumentModerationAndSummarizationService aiService;
  private final ObjectMapper objectMapper;

  /**
   * Webhook endpoint to receive AI processing results
   * POST /api/v1/ai/webhook
   * Note: This endpoint should be accessible from AI service (internal network)
   * Consider adding IP whitelist or secret token validation in production
   */
  @PostMapping("/webhook")
  @Transactional
  public ResponseEntity<?> handleWebhook(@RequestBody WebhookPayload payload) {
    try {
      log.info("Received webhook callback. Payload: jobId={}, status={}, hasResult={}, hasError={}", 
          payload.getJobId(), 
          payload.getStatus(),
          payload.getResult() != null, 
          payload.getError() != null);
      
      // Validate payload
      if (payload.getJobId() == null || payload.getJobId().isEmpty()) {
        log.error("Webhook payload missing job_id. Full payload: {}", objectMapper.writeValueAsString(payload));
        return ResponseEntity.badRequest().body("Missing job_id");
      }
      
      if (payload.getStatus() == null || payload.getStatus().isEmpty()) {
        log.error("Webhook payload missing status. Full payload: {}", objectMapper.writeValueAsString(payload));
        return ResponseEntity.badRequest().body("Missing status");
      }

      // Find job by jobId
      AiProcessingJob job = aiProcessingJobRepository.findByJobId(payload.getJobId())
          .orElseThrow(() -> new RuntimeException("Job not found: " + payload.getJobId()));

      // Update job status
      if ("completed".equalsIgnoreCase(payload.getStatus())) {
        job.setStatus(AiJobStatus.COMPLETED);
        if (payload.getResult() != null && payload.getResult().getTimings() != null) {
          if (payload.getResult().getTimings().getTotalMs() != null) {
            job.setProcessingTimeSeconds(payload.getResult().getTimings().getTotalMs() / 1000.0);
          }
        }
        log.info("Job {} completed successfully", payload.getJobId());

        // Update document based on AI response
        aiService.updateDocumentAfterAiProcessing(job.getDocument().getId(), payload.getResult());

      } else if ("failed".equalsIgnoreCase(payload.getStatus())) {
        job.setStatus(AiJobStatus.FAILED);
        job.setErrorMessage(payload.getError());
        log.error("Job {} failed: {}", payload.getJobId(), payload.getError());

        // Handle error
        aiService.handleAiProcessingError(job.getDocument().getId(), 
            new RuntimeException(payload.getError()));
      }

      // Update timestamps if available
      if (payload.getResult() != null && payload.getResult().getTimings() != null) {
        // You can extract timing info if needed
      }

      job.setCompletedAt(System.currentTimeMillis() / 1000);
      aiProcessingJobRepository.save(job);

      return ResponseEntity.ok().build();

    } catch (Exception e) {
      log.error("Error processing webhook: {}", e.getMessage(), e);
      return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Error: " + e.getMessage());
    }
  }
}

