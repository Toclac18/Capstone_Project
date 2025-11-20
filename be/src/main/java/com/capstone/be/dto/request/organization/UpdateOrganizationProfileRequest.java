package com.capstone.be.dto.request.organization;

import com.capstone.be.domain.enums.OrgType;
import jakarta.validation.constraints.Email;
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
public class UpdateOrganizationProfileRequest {

  @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
  private String fullName;

  @Size(min = 2, max = 200, message = "Organization name must be between 2 and 200 characters")
  private String name;

  private OrgType type;

  @Email(message = "Organization email must be a valid email address")
  @Size(max = 100, message = "Organization email must not exceed 100 characters")
  private String email;

  @Pattern(regexp = "^[+]?[0-9\\s-()]{8,20}$", message = "Hotline must be a valid phone number")
  @Size(max = 20, message = "Hotline must not exceed 20 characters")
  private String hotline;

  @Size(max = 500, message = "Address must not exceed 500 characters")
  private String address;

  @Size(max = 50, message = "Registration number must not exceed 50 characters")
  private String registrationNumber;
}
