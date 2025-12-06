package com.capstone.be.dto.request.review;

import com.capstone.be.domain.enums.ReviewDecision;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for submitting a review for a document
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitReviewRequest {

  /**
   * Review report content written by the reviewer
   */
  @NotBlank(message = "Review report is required")
  @Size(min = 50, max = 10000, message = "Review report must be between 50 and 10000 characters")
  private String report;

  /**
   * Decision made by the reviewer (APPROVED or REJECTED)
   */
  @NotNull(message = "Review decision is required")
  private ReviewDecision decision;
}
