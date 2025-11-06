package com.capstone.be.dto.response.organization;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationListResponse {

  private List<OrganizationResponse> organizations;
  private Integer total;
  private Integer page;
  private Integer limit;
}


