package com.capstone.be.dto.request.organization;

import com.capstone.be.domain.enums.OrgEnrollStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating enrollment status
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateEnrollStatusRequest {

  /**
   * New enrollment status
   */
  @NotNull(message = "Status is required")
  private OrgEnrollStatus status;
}
