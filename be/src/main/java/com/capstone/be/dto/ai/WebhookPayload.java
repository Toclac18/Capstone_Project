package com.capstone.be.dto.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Webhook payload from AI service when job completes
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WebhookPayload {

  @JsonProperty("job_id")
  private String jobId;
  private String status; // "completed" or "failed"
  private AiModerationResponse result; // Present if status is "completed"
  private String error; // Present if status is "failed"
}

