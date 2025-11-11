package com.capstone.be.dto.response.document;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentDetailResponse {

  private UUID id;
  private String title;
  private String description;
  private String file_name;
  private Boolean isPublic;
  private Boolean isPremium;
  private Integer price;
  private Integer viewCount;
  private Boolean deleted;
  private LocalDateTime createdAt;
  private LocalDateTime updatedAt;

  // Uploader info (full - email, status will be set)
  private DocumentUploaderInfo uploader;

  // Organization info (can be null - type, email, status will be set)
  private DocumentOrganizationInfo organization;

  private DocumentTypeInfo type;

  private List<DocumentSpecializationInfo> specializations;

  private List<DocumentTagInfo> tags;

  private Long commentCount;
  private Long saveCount;
  private Long upvoteCount;
  private Long downvoteCount;
  private Long reportCount;
  private Long purchaseCount; // Only if isPremium = true

  // Reviewer info (only if isPremium = true and has successful review)
  private DocumentReviewerInfo reviewer;
}

