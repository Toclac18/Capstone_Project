package com.capstone.be.dto.request.specialization;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating an existing specialization
 * Used by Business Admin
 * Specialization ID is passed via path parameter (RESTful)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSpecializationRequest {

  @Min(value = 1, message = "Specialization code must be positive")
  private Integer code;

  @Size(min = 3, max = 100, message = "Specialization name must be between 3 and 100 characters")
  @Pattern(regexp = "^[\\p{L}\\p{N}\\s\\-]+$", message = "Specialization name can only contain letters, numbers, spaces, and hyphens")
  private String name;

  private UUID domainId;
}
