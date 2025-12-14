package com.capstone.be.dto.request.auth;

import com.capstone.be.domain.enums.EducationLevel;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegisterReviewerRequest {

  @NotBlank(message = "Email is required")
  @Email(message = "Email should be valid")
  private String email;

  @NotBlank(message = "Password is required")
  @Size(min = 6, message = "Password must be at least 6 characters")
  private String password;

  @NotBlank(message = "Full name is required")
  @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
  private String fullName;

  @NotNull(message = "Date of birth is required")
  @Past(message = "Date of birth must be in the past")
  private LocalDate dateOfBirth;

  private String orcid; // Optional

  @NotNull(message = "Education level is required")
  private EducationLevel educationLevel;

  @NotBlank(message = "Organization name is required")
  private String organizationName;

  @NotBlank(message = "Organization email is required")
  @Email(message = "Organization email should be valid")
  private String organizationEmail;

  @NotNull(message = "Domain IDs are required")
  @Size(min = 1, max = 3, message = "Must select 1 to 3 domains")
  private List<UUID> domainIds;

  @NotNull(message = "Specialization IDs are required")
  @Size(min = 1, max = 5, message = "Must select 1 to 5 specializations")
  private List<UUID> specializationIds;

  // Note: credential files will be uploaded separately via multipart
  // This DTO is for JSON data only
}
