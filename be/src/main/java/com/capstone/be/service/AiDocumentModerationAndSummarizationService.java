package com.capstone.be.service;

import com.capstone.be.dto.ai.AiModerationResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;
import java.util.concurrent.CompletableFuture;

/**
 * Service for AI-based document moderation and summarization
 * Handles asynchronous processing of documents through external AI service
 */
public interface AiDocumentModerationAndSummarizationService {

  /**
   * Process document asynchronously through AI moderation and summarization service
   *
   * @param documentId the document ID to update after processing
   * @param file the multipart file to process
   * @return CompletableFuture with AI processing response
   */
  CompletableFuture<AiModerationResponse> processDocumentAsync(UUID documentId, MultipartFile file);
}
