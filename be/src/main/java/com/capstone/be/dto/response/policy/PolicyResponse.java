package com.capstone.be.dto.response.policy;

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
public class PolicyResponse {

  private UUID id;
  private String version;
  private String title;
  private String content; // HTML content
  private Boolean isActive;
  private Instant createdAt;
  private Instant updatedAt;
}

