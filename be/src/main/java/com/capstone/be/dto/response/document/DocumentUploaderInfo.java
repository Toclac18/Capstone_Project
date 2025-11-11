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
public class DocumentUploaderInfo {

  private UUID id;
  private String fullName;
  private String username;
  private String avatarUrl;
  
  // Optional fields for Detail view
  private String email;      // null for List, set for Detail
  private String status;      // null for List, set for Detail
}
