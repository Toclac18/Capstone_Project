package com.capstone.be.dto.response.organization;

import com.capstone.be.domain.enums.OrgEnrollStatus;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for organization enrollment
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrgEnrollmentResponse {

  private UUID enrollmentId;

  private UUID memberId;
  private String memberEmail;
  private String memberFullName;
  private String memberAvatarUrl;

  private UUID organizationId;
  private String organizationName;

  private OrgEnrollStatus status;

  private Instant invitedAt;
  private Instant respondedAt;
}
