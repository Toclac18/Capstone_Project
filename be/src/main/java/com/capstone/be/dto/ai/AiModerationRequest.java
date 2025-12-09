package com.capstone.be.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for AI moderation and summarization service
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AiModerationRequest {

  private byte[] file;
  private String fileName;
}
