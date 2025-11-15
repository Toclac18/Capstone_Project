package com.capstone.be.dto.request.reviewer;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for approving/rejecting a reviewer registration
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApproveReviewerRequest {

  @NotNull(message = "Reviewer ID is required")
  private UUID reviewerId;

  @NotNull(message = "Approval decision is required")
  private Boolean approved;

  private String rejectionReason; // Required if approved = false
}
