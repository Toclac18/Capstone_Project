package com.capstone.be.dto.request.doctype;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating an existing document type
 * Used by Business Admin
 * DocType ID is passed via path parameter (RESTful)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateDocTypeRequest {

  @NotNull(message = "Document type code is required")
  @Min(value = 1, message = "Document type code must be positive")
  private Integer code;

  @NotBlank(message = "Document type name is required")
  @Size(min = 3, max = 100, message = "Document type name must be between 3 and 100 characters")
  @Pattern(regexp = "^[\\p{L}\\p{N}\\s\\-]+$", message = "Document type name can only contain letters, numbers, spaces, and hyphens")
  private String name;

  @Size(max = 500, message = "Description must not exceed 500 characters")
  private String description;
}
