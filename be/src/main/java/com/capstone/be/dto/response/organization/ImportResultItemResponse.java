package com.capstone.be.dto.response.organization;

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
public class ImportResultItemResponse {
  private UUID id;
  private String email;
  private String status;  // SUCCESS, FAILED, SKIPPED
  private String reason;
  private Instant createdAt;
}
