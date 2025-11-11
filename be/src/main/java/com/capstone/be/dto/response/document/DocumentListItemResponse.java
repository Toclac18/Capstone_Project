package com.capstone.be.dto.response.document;

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
public class DocumentListItemResponse {

  private UUID id;
  private String title;
  private Boolean isPublic;
  private Boolean isPremium;
  private Integer viewCount;
  private Boolean deleted;
  private LocalDateTime createdAt;

  private DocumentUploaderInfo uploader;

  private DocumentOrganizationInfo organization;

  private DocumentTypeInfo type;
}

