package com.capstone.be.dto.response.specialization;

import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for Specialization details (for admin)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SpecializationDetailResponse {

  private UUID id;

  private Integer code;

  private String name;

  private DomainInfo domain;

  private Instant createdAt;

  private Instant updatedAt;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class DomainInfo {
    private UUID id;
    private Integer code;
    private String name;
  }
}
