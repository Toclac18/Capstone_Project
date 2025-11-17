package com.capstone.be.dto.response.organization;

import com.capstone.be.domain.enums.OrgType;
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
public class OrganizationProfileResponse {

  // User fields
  private UUID userId;
  private String email;
  private String fullName;
  private String avatarUrl;
  private Integer point;
  private UserStatus status;

  // Organization profile fields
  private String orgName;
  private OrgType orgType;
  private String orgEmail;
  private String orgHotline;
  private String orgLogo;
  private String orgAddress;
  private String orgRegistrationNumber;

  private Instant createdAt;
  private Instant updatedAt;
}
