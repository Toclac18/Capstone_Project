package com.capstone.be.dto.response.admin;

import com.capstone.be.domain.enums.UserStatus;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminOrganizationResponse {

  // User info (OrgAdmin)
  private UUID userId;
  private String email;
  private String fullName;
  private String avatarUrl;
  private Integer point;
  private UserStatus status;

  // Organization profile info
  private String orgName;
  private String orgType;
  private String orgEmail;
  private String orgHotline;
  private String orgLogo;
  private String orgAddress;
  private String orgRegistrationNumber;

  private Instant createdAt;
  private Instant updatedAt;
}
