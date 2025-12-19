package com.capstone.be.dto.request.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerifyPasswordResetOtpRequest {

  @NotBlank(message = "Email is required")
  private String email;

  @NotBlank(message = "OTP is required")
  @Pattern(regexp = "^[0-9]{6}$", message = "OTP must be 6 digits")
  private String otp;

  @NotBlank(message = "New password is required")
  @Size(min = 8, message = "Password must be at least 8 characters")
  private String newPassword;
}
