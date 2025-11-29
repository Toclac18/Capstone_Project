package com.capstone.be.dto.request.doctype;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating a new document type
 * Used by Business Admin
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateDocTypeRequest {

  @NotNull(message = "Document type code is required")
  @Min(value = 1, message = "Document type code must be positive")
  private Integer code;

  @NotBlank(message = "Document type name is required")
  @Size(min = 2, max = 100, message = "Document type name must be between 2 and 100 characters")
  private String name;

  @Size(max = 500, message = "Description must not exceed 500 characters")
  private String description;
}
