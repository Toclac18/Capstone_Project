package com.capstone.be.dto.request.policy;

import com.capstone.be.domain.enums.PolicyStatus;
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

  @Size(max = 10000, message = "Content must not exceed 10000 characters")
  private String content;

  private PolicyStatus status;

  private Boolean isRequired;
}

