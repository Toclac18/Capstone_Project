package com.capstone.be.dto.response.admin;

import com.capstone.be.domain.enums.EducationLevel;
import com.capstone.be.domain.enums.UserStatus;
import java.time.Instant;
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
public class AdminReviewerResponse {

  private UUID userId;
  private String email;
  private String fullName;
  private String avatarUrl;
  private Integer point;
  private UserStatus status;
  private LocalDate dateOfBirth;
  private String ordid;
  private EducationLevel educationLevel;
  private String organizationName;
  private String organizationEmail;
  private List<String> credentialFileUrls;
  private Instant createdAt;
  private Instant updatedAt;
}
