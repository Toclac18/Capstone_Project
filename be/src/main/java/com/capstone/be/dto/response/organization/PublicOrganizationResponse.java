package com.capstone.be.dto.response.organization;

import com.capstone.be.domain.enums.OrgType;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for public organization information
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PublicOrganizationResponse {

  private UUID id;
  private String name;
  private OrgType type;
  private String email;
  private String hotline;
  private String logo;
  private String address;
  private Instant createdAt;

  // Statistics
  private Long memberCount;
  private Long documentCount;
}
