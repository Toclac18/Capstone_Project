package com.capstone.be.dto.response.reader;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class JoinedOrganizationResponse {

  UUID organizationId;
  String organizationName;
  LocalDateTime joinedAt;
}

