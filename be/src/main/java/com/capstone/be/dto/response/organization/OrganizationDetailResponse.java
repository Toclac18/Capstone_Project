package com.capstone.be.dto.response.organization;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class OrganizationDetailResponse {
  private UUID id;
  private String email;
  private String hotline;
  private String logo;
  private String address;
  private String status;
  private String adminName;
  private String adminEmail;
  private Boolean active;
  private Boolean deleted;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;
  private Integer totalMembers;
  private Integer totalDocuments;
}


