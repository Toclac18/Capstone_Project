package com.capstone.be.dto.request.organization;

import com.capstone.be.domain.enums.OrganizationStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateOrganizationStatusRequest {

  @NotNull(message = "Status is required")
  private OrganizationStatus status; // PENDING_VERIFICATION | ACTIVE | DEACTIVE | DELETED
}


