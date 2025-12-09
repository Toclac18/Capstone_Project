package com.capstone.be.dto.request.policy;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePolicyRequest {

  @NotBlank(message = "Version is required")
  @Size(max = 50, message = "Version must not exceed 50 characters")
  private String version; // e.g., "1.0", "2.0", "v1", "v2"

  @NotBlank(message = "Title is required")
  @Size(max = 255, message = "Title must not exceed 255 characters")
  private String title;

  @NotBlank(message = "Content is required")
  @Size(max = 100000, message = "Content must not exceed 100000 characters")
  private String content; // HTML content
}

