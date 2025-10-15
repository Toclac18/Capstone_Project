package com.capstone.be.dto.request;

import com.capstone.be.domain.enums.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginRequest {

  @NotNull
  private UserRole role;

  @NotBlank
  @Email
  private String email;

  @NotBlank
  private String password;
}
