package com.capstone.be.dto.request.reviewer;

import com.capstone.be.domain.enums.EducationLevel;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateReviewerProfileRequest {

  @Size(min = 2, max = 100, message = "Full name must be between 2 and 100 characters")
  private String fullName;

  @Past(message = "Date of birth must be in the past")
  private LocalDate dateOfBirth;

  @Size(max = 50, message = "ORCID must not exceed 50 characters")
  private String ordid;

  private EducationLevel educationLevel;

  @Size(max = 200, message = "Organization name must not exceed 200 characters")
  private String organizationName;

  @Email(message = "Organization email must be a valid email address")
  @Size(max = 100, message = "Organization email must not exceed 100 characters")
  private String organizationEmail;
}
