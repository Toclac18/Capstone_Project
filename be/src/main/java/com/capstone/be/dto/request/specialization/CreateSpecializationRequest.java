package com.capstone.be.dto.request.specialization;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating a new specialization
 * Used by Business Admin
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSpecializationRequest {

  @NotNull(message = "Specialization code is required")
  @Min(value = 1, message = "Specialization code must be positive")
  private Integer code;

  @NotBlank(message = "Specialization name is required")
  @Size(min = 3, max = 100, message = "Specialization name must be between 3 and 100 characters")
  @Pattern(regexp = "^[\\p{L}\\p{N}\\s\\-]+$", message = "Specialization name can only contain letters, numbers, spaces, and hyphens")
  private String name;

  @NotNull(message = "Domain ID is required")
  private UUID domainId;
}
