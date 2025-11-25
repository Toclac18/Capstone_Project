package com.capstone.be.dto.request.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request to verify OTP (does not reset password, returns reset token)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VerifyOtpRequest {

  @NotBlank(message = "Email is required")
  @Email(message = "Invalid email format")
  private String email;

  @NotBlank(message = "OTP is required")
  @Pattern(regexp = "^\\d{6}$", message = "OTP must be 6 digits")
  private String otp;
}
