package com.capstone.be.dto.request.organization;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class UpdateOrganizationStatusRequest {
  @NotBlank(message = "Status is required")
  private String status; // ACTIVE | INACTIVE
}


