package com.capstone.be.dto.response.document;

import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.DocVisibility;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for document upload history - lightweight for list view
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentUploadHistoryResponse {

  private UUID id;
  private String title;
  private String description;
  private DocVisibility visibility;
  private DocStatus status;
  private Boolean isPremium;
  private Integer price;
  private String thumbnailUrl;
  private Integer viewCount;
  private Integer upvoteCount;
  private Integer voteScore;
  private Integer pageCount;
  private Instant createdAt;
  private Instant updatedAt;

  // Basic info
  private String docTypeName;
  private String specializationName;
  private String domainName;
  private String organizationName;

  // Statistics
  private Integer redemptionCount;
}
