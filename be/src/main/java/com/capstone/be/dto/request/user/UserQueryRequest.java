package com.capstone.be.dto.request.user;

import lombok.Data;

@Data
public class UserQueryRequest {

  private Integer page = 1;
  private Integer limit = 10;
  private String search;
  private String role;
  private String status;
  private String sortBy = "createdAt";
  private String sortOrder = "desc";
  private String dateFrom;
  private String dateTo;
}

