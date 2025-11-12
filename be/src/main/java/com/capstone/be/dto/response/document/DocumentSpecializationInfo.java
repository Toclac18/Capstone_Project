package com.capstone.be.dto.response.document;

import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentSpecializationInfo {

  private UUID id;
  private Integer code;
  private String name;
  private DomainInfo domain;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class DomainInfo {

    private UUID id;
    private Integer code;
    private String name;
  }
}

