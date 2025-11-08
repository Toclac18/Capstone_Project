package com.capstone.be.dto.response.reader;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.Builder;
import lombok.Value;

@Value
@Builder
public class JoinedOrganizationResponse {

  UUID organizationId;
  String organizationEmail;
  String hotline;
  String logo;
  String address;
  String status;
  Boolean active;
  LocalDateTime joinedAt;
}

