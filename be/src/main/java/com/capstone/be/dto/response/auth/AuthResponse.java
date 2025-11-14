package com.capstone.be.dto.response.auth;

import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.domain.enums.UserStatus;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

  private UUID userId;
  private String email;
  private String fullName;
  private UserRole role;
  private UserStatus status;
  private String accessToken;

  @Builder.Default
  private String tokenType = "Bearer";
}
