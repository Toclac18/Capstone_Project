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
 * Note: This is used with @RequestPart in multipart/form-data request
 * The actual review report file (docx) is sent separately as @RequestPart MultipartFile
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubmitReviewRequest {

  /**
   * Review comment written by the reviewer
   */
  @NotBlank(message = "Review comment is required")
  @Size(min = 10, max = 5000, message = "Review comment must be between 10 and 5000 characters")
  private String report;

  /**
   * Decision made by the reviewer (APPROVED or REJECTED)
   */
  @NotNull(message = "Review decision is required")
  private ReviewDecision decision;
}
