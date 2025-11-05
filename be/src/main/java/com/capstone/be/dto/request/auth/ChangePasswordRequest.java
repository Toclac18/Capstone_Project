package com.capstone.be.dto.request.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChangePasswordRequest {

  @NotBlank
  private String currentPassword;

  @NotBlank
  @Size(min = 8, max = 64, message = "Password's length must be between 8 and 64")
  @Pattern(regexp = "^(?=.*[a-zA-Z])(?=.*\\d).+$",
      message = "Password must contain digit and alphabet")
  private String newPassword;
}
