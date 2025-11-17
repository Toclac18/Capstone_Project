package com.capstone.be.dto.request.admin;

import com.capstone.be.domain.enums.UserStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserStatusRequest {

  @NotNull(message = "Status is required")
  private UserStatus status;

  private String reason; // Optional reason for status change (for audit log)
}
