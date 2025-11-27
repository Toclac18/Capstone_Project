package com.capstone.be.dto.request.specialization;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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

  @NotNull(message = "Specialization code is required")
  @Min(value = 1, message = "Specialization code must be positive")
  private Integer code;

  @NotBlank(message = "Specialization name is required")
  @Size(min = 2, max = 200, message = "Specialization name must be between 2 and 200 characters")
  private String name;

  @NotNull(message = "Domain ID is required")
  private UUID domainId;
}
