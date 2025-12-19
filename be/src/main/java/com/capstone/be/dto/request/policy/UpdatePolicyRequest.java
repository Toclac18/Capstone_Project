package com.capstone.be.dto.request.policy;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePolicyRequest {

  @Size(max = 255, message = "Title must not exceed 255 characters")
  private String title;

  @Size(max = 100000, message = "Content must not exceed 100000 characters")
  private String content;

  // Note: version is immutable and cannot be updated
  // Note: isActive should be changed via activate/deactivate endpoints
}

