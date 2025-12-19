package com.capstone.be.dto.ai;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO when submitting a job to AI service
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class JobSubmitResponse {

  @JsonProperty("job_id")
  private String jobId;
  private String status; // "pending"
  private String message;
}

