package com.capstone.be.dto.request.auth;

import com.capstone.be.domain.enums.OrgType;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for organization registration
 * Organization admin will be created along with organization profile
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterOrganizationRequest {

  // Admin account info
  @NotBlank(message = "Admin email is required")
  @Email(message = "Invalid email format")
  private String adminEmail;

  @NotBlank(message = "Password is required")
  @Size(min = 8, message = "Password must be at least 8 characters")
  private String password;

  @NotBlank(message = "Admin full name is required")
  @Size(min = 2, max = 100, message = "Admin full name must be between 2 and 100 characters")
  private String adminFullName;

  // Organization info
  @NotBlank(message = "Organization name is required")
  @Size(min = 2, max = 200, message = "Organization name must be between 2 and 200 characters")
  private String organizationName;

  @NotNull(message = "Organization type is required")
  private OrgType organizationType;

  @NotBlank(message = "Organization email is required")
  @Email(message = "Invalid organization email format")
  private String organizationEmail;

  @NotBlank(message = "Hotline is required")
  @Pattern(regexp = "^[0-9+\\-() ]+$", message = "Invalid hotline format")
  private String hotline;

  @NotBlank(message = "Address is required")
  @Size(min = 10, max = 500, message = "Address must be between 10 and 500 characters")
  private String address;

  @NotBlank(message = "Registration number is required")
  @Size(min = 5, max = 50, message = "Registration number must be between 5 and 50 characters")
  private String registrationNumber;

  // Optional logo will be uploaded separately via multipart
}
