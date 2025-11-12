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
public class DocumentOrganizationInfo {

  private UUID id;
  private String name;
  private String logo;

  // Optional fields for Detail view
  private String type;       // null for List, set for Detail
  private String email;      // null for List, set for Detail
  private String status;     // null for List, set for Detail
}
