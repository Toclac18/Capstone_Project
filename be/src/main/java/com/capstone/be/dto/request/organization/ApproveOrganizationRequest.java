package com.capstone.be.dto.request.organization;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for approving/rejecting an organization registration
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApproveOrganizationRequest {

  @NotNull(message = "User ID is required")
  private UUID userId;

  @NotNull(message = "Approval decision is required")
  private Boolean approved;

  private String rejectionReason; // Required if approved = false
}
