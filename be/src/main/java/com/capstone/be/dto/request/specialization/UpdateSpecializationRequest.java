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

  private Integer code;

  private String name;

  private UUID domainId;
}
