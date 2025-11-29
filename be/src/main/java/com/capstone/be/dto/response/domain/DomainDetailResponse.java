package com.capstone.be.dto.response.domain;

import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for Domain details (for admin)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DomainDetailResponse {

  private UUID id;

  private Integer code;

  private String name;

  private Instant createdAt;

  private Instant updatedAt;
}
