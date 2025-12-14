package com.capstone.be.dto.response.resource;

import java.util.List;
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
public class DomainWithSpecializationsResponse {

  private UUID id;
  private Integer code;
  private String name;
  private List<SpecializationInfo> specializations;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class SpecializationInfo {

    private UUID id;
    private Integer code;
    private String name;
  }
}
