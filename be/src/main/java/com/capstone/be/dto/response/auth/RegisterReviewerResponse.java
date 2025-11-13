package com.capstone.be.dto.response.auth;

import com.capstone.be.domain.enums.EducationLevel;
import com.capstone.be.domain.enums.ReviewerStatus;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;
import lombok.Data;

@Data
public class RegisterReviewerResponse {

  private UUID id;

  private String username;

  private String email;

  private String fullName;

  private LocalDate dateOfBirth;

  private String ordid; //#temp, nullable

  private EducationLevel educationLevel;

  private String organizationName;

  private String organizationEmail;

  ReviewerStatus status = ReviewerStatus.PENDING_EMAIL_VERIFICATION;

  private Set<String> domainNames;

  private Set<String> reviewSpecializationNames;
}
