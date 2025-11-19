package com.capstone.be.dto.response.reviewer;

import com.capstone.be.domain.enums.UserStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for pending reviewer details (for Business Admin)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PendingReviewerResponse {

  private UUID userId;
  private String email;
  private String fullName;
  private UserStatus status;
  private Instant registeredAt;

  // Reviewer profile details
  private UUID reviewerProfileId;
  private LocalDate dateOfBirth;
  private String orcid;
  private String educationLevel;
  private String organizationName;
  private String organizationEmail;
  private List<String> credentialFileUrls;

  // Domain and specialization info
  private List<DomainInfo> domains;
  private List<SpecializationInfo> specializations;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class DomainInfo {

    private UUID id;
    private String name;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class SpecializationInfo {

    private UUID id;
    private String name;
    private UUID domainId;
    private String domainName;
  }
}
