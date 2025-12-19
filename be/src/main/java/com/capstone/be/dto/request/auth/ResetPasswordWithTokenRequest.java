package com.capstone.be.dto.request.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request to reset password using reset token
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ResetPasswordWithTokenRequest {

  @NotBlank(message = "Reset token is required")
  private String resetToken;

  @NotBlank(message = "New password is required")
  @Size(min = 8, message = "Password length must at least 8 characters")
  private String newPassword;
}
