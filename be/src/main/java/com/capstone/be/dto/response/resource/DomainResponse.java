package com.capstone.be.dto.response.resource;

import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for Domain with nested Specializations
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DomainResponse {

  private UUID id;
  private Integer code;
  private String name;
}