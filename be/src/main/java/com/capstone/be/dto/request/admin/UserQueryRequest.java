package com.capstone.be.dto.request.admin;

import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.domain.enums.UserStatus;
import java.time.Instant;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserQueryRequest {

  private Integer page;
  private Integer limit;
  private String search;
  private UserRole role;
  private UserStatus status;
  private String sortBy;
  private String sortOrder;
  private Instant dateFrom;
  private Instant dateTo;
}


