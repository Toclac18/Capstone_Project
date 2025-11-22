package com.capstone.be.dto.request.admin;

import com.capstone.be.domain.enums.UserRole;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ChangeRoleRequest {

  @NotNull(message = "Role is required")
  private UserRole role;

  private String reason; // Optional reason for role change (for audit log)
}

