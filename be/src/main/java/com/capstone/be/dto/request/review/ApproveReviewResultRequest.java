package com.capstone.be.dto.request.review;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for BA to approve or reject a review result
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ApproveReviewResultRequest {

  /**
   * true = approve the review result (apply reviewer's decision to document)
   * false = reject the review result (reviewer must re-review)
   */
  @NotNull(message = "Approval decision is required")
  private Boolean approved;

  /**
   * Required if approved = false
   * Reason why BA rejects the review result
   */
  @Size(max = 1000, message = "Rejection reason must not exceed 1000 characters")
  private String rejectionReason;
}
