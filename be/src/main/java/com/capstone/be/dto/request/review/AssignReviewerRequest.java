package com.capstone.be.dto.request.review;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AssignReviewerRequest {

  @NotNull(message = "Reviewer ID is required")
  private UUID reviewerId;

  @Size(max = 1000, message = "Note must not exceed 1000 characters")
  private String note;

  /**
   * Optional: ID of existing review request to cancel when changing reviewer
   * Only used when changing reviewer for a document with PENDING review request
   */
  private UUID existingReviewRequestId;
}
