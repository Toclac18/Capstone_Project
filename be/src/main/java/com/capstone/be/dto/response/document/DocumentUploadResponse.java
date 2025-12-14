package com.capstone.be.dto.response.document;

import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.DocVisibility;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for document upload - simplified for user
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentUploadResponse {

  private UUID id;
  private String title;
  private DocVisibility visibility;
  private String type;  // DocType name
  private Boolean isPremium;
  private Integer price;
  private DocStatus status;
  private String specializationName;
  private String domainName;
  private UUID organizationId;
  private String organizationName;
  private String thumbnail; //thumbnail url
  private List<String> tagNames;
  private Instant createdAt;
}
