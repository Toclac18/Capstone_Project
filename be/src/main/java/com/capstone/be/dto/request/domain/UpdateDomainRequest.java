package com.capstone.be.dto.request.domain;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating an existing domain Used by Business Admin Domain ID is passed via path
 * parameter (RESTful)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateDomainRequest {


  private Integer code;

  private String name;
}
