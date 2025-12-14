package com.capstone.be.dto.response.organization;

import com.capstone.be.domain.enums.OrgType;
import com.capstone.be.domain.enums.UserStatus;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for pending organization details (for Business Admin)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingOrganizationResponse {

  // Admin user info
  private UUID adminUserId;
  private String adminEmail;
  private String adminFullName;
  private UserStatus adminStatus;
  private Instant registeredAt;

  // Organization profile info
  private UUID organizationProfileId;
  private String organizationName;
  private OrgType organizationType;
  private String organizationEmail;
  private String hotline;
  private String address;
  private String registrationNumber;
  private String logo;
}
