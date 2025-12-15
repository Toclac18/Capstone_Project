package com.capstone.be.dto.request.tag;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating a new tag
 * Used by Business Admin to manually create tags with ACTIVE status
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateTagRequest {

  @NotBlank(message = "Tag name is required")
  @Size(min = 2, max = 50, message = "Tag name must be between 2 and 50 characters")
  @Pattern(regexp = "^[\\p{L}\\p{N}\\s\\-]+$", message = "Tag name can only contain letters, numbers, spaces, and hyphens")
  private String name;
}
