package com.capstone.be.dto.request.auth;

import com.capstone.be.domain.enums.EducationLevel;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Past;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterReviewerInfo {

  @NotBlank
  private String fullName;

  @NotNull
  @Past
  private LocalDate dateOfBirth;

  @NotBlank
  private String username;

  @NotBlank
  @Email
  private String email;

  @NotBlank
  @Size(min = 8, max = 64, message = "Password's length must be between 8 and 64")
  @Pattern(regexp = "^(?=.*[a-zA-Z])(?=.*\\d).+$",
      message = "Password must contain digit and alphabet")
  private String password;

  @NotNull
  private EducationLevel educationLevel;

  @NotEmpty
  private Set<UUID> domainIds;

  @NotEmpty
  private Set<UUID> reviewSpecializationIds;

  @NotBlank
  private String organizationName;

  @NotBlank
  @Email
  private String organizationEmail;

}
