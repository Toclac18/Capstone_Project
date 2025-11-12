package com.capstone.be.dto.request.auth;

import com.capstone.be.domain.enums.OrganizationType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class RegisterOrganizationInfo {

  @NotBlank
  private String name;

  @NotNull
  private OrganizationType type;

  @NotBlank
  private String hotline;

  @NotBlank
  private String address;

  @NotBlank
  private String registrationNumber;

  @NotBlank
  @Email
  private String email;

  @NotBlank
  private String adminName;

  @NotBlank
  @Email
  private String adminEmail;

  @NotBlank
  @Size(min = 8, max = 64, message = "Password's length must be between 8 and 64")
  @Pattern(regexp = "^(?=.*[a-zA-Z])(?=.*\\d).+$",
      message = "Password must contain digit and alphabet")
  private String adminPassword;


}
