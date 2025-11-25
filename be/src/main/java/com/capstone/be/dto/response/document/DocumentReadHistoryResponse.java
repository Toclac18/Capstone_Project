package com.capstone.be.dto.response.document;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for document read history
 * Shows when a user accessed a document
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentReadHistoryResponse {

  private UUID id;
  private Instant readAt;

  // Document info
  private DocumentInfo document;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class DocumentInfo {

    private UUID id;
    private String title;
    private String description;
    private Boolean isPremium;
    private String thumbnailUrl;
    private String docTypeName;
    private String specializationName;
    private String domainName;
    private List<String> tagNames;

    // Uploader info
    private UploaderInfo uploader;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class UploaderInfo {

    private UUID id;
    private String fullName;
    private String avatarUrl;
  }
}
