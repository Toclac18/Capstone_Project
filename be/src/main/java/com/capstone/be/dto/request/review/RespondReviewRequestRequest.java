package com.capstone.be.dto.request.review;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RespondReviewRequestRequest {

  @NotNull(message = "Accept status is required")
  private Boolean accept;  // true = accept, false = reject

  @Size(max = 1000, message = "Rejection reason must not exceed 1000 characters")
  private String rejectionReason;  // Required if accept = false
}
