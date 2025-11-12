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
public class DocumentReviewerInfo {

  private UUID id;
  private String fullName;
  private String username;
  private String email;
}

