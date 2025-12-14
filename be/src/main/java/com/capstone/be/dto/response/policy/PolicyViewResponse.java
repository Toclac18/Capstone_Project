package com.capstone.be.dto.response.policy;

import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PolicyViewResponse {

  private PolicyResponse policy;
  private Boolean hasAccepted; // Whether current user has accepted this policy
  private Instant acceptanceDate; // When user accepted (if applicable)
}

