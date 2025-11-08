package com.capstone.be.dto.request.document;

import java.util.UUID;
import lombok.Data;

@Data
public class DocumentQueryRequest {

  private Integer page = 1;
  private Integer limit = 10;
  private String search;
  private UUID organizationId;
  private UUID typeId;
  private Boolean isPublic;
  private Boolean isPremium;
  private Boolean deleted;
  private String sortBy = "createdAt";
  private String sortOrder = "desc";
  private String dateFrom;
  private String dateTo;
}

