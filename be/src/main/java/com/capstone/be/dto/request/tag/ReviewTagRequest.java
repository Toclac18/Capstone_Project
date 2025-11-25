package com.capstone.be.dto.request.tag;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for reviewing (accept/reject) pending tags
 * Used by Business Admin to approve or reject user-created tags
 * Tag ID is passed via path parameter (RESTful)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewTagRequest {

  @NotNull(message = "Approved status is required")
  private Boolean approved;
}
