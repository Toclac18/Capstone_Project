package com.capstone.be.dto.response.admin;

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
public class SystemConfigResponse {

  private UUID id;
  private String configKey;
  private String configValue;
  private String description;
  private String configType; // STRING, NUMBER, BOOLEAN, JSON
  private Boolean isEditable;
  private Instant createdAt;
  private Instant updatedAt;
}

