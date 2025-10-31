package com.capstone.be.dto.request.auth;

import com.capstone.be.domain.enums.EducationLevel;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.io.File;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class RegisterReviewerRequest {

  @NotBlank
  private String fullName;

  @NotNull
  @Past
  private LocalDate dateOfBirth;

  @NotBlank
  private String username;

  @Email
  private String email;

  @NotBlank
  @Size(min = 8, max = 64, message = "Password's length must be between 8 and 64")
  @Pattern(regexp = "^(?=.*[a-zA-Z])(?=.*\\d).+$",
      message = "Password must contain digit and alphabet")
  private String password;

  private EducationLevel educationLevel;

  private UUID areaOfExpertise;

  private List<UUID> reviewFields;

  private String referenceOrganizationName;

  private String referenceOrganizationEmail;

  private File verifiedBackgroundUpload;

}
