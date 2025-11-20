package com.capstone.be.dto.response.organization;

import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for member import batch
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberImportBatchResponse {

  private UUID id;
  private String importSource;
  private Integer totalEmails;
  private Integer successCount;
  private Integer failedCount;
  private Integer skippedCount;
  private String fileName;
  private String fileUrl;
  private String notes;
  private String adminName;
  private String adminEmail;
  private Instant importedAt;
}
