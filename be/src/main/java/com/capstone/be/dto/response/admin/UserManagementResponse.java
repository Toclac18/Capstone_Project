package com.capstone.be.dto.response.admin;

import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.domain.enums.UserStatus;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserManagementResponse {

  private UUID id;
  private String email;
  private String fullName;
  private String avatarUrl;
  private UserRole role;
  private UserStatus status;
  private Instant createdAt;
  private Instant updatedAt;
}


