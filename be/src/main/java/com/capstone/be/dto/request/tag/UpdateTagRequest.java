package com.capstone.be.dto.request.tag;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating an existing tag
 * Used by Business Admin to edit tag name
 * Tag ID is passed via path parameter (RESTful)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateTagRequest {

  @NotBlank(message = "Tag name is required")
  @Size(min = 2, max = 50, message = "Tag name must be between 2 and 50 characters")
  private String name;
}
