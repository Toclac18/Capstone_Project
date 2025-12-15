package com.capstone.be.dto.request.domain;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating an existing domain Used by Business Admin Domain ID is passed via path
 * parameter (RESTful)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateDomainRequest {

  @Min(value = 1, message = "Domain code must be positive")
  private Integer code;

  @Size(min = 3, max = 100, message = "Domain name must be between 3 and 100 characters")
  @Pattern(regexp = "^[\\p{L}\\p{N}\\s\\-]+$", message = "Domain name can only contain letters, numbers, spaces, and hyphens")
  private String name;
}
