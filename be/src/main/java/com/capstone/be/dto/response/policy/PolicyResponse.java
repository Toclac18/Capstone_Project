package com.capstone.be.dto.response.policy;

import com.capstone.be.domain.enums.PolicyStatus;
import com.capstone.be.domain.enums.PolicyType;
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
  private PolicyType type;
  private String title;
  private String content; // HTML content
  private PolicyStatus status;
  private Boolean isRequired;
  private Instant updatedAt;
}

