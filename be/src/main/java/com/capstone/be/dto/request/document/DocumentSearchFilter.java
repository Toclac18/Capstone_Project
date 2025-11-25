package com.capstone.be.dto.request.document;

import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Filter criteria for searching public documents
 * All fields are optional
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentSearchFilter {

  private String searchKeyword;
  private UUID docTypeId;
  private UUID specializationId;
  private UUID domainId;
  private UUID organizationId;
  private List<Long> tagCodes;
  private Boolean isPremium;

  //Paging
  private Integer page = 0;
  private Integer size = 20;
  private List<String> sorts;
}
