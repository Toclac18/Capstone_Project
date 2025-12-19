package com.capstone.be.dto.response.report;

import com.capstone.be.domain.enums.ReportReason;
import com.capstone.be.domain.enums.ReportStatus;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ReportResponse {

  private UUID id;
  private UUID documentId;
  private String documentTitle;
  private ReporterInfo reporter;
  private ReportReason reason;
  private String description;
  private ReportStatus status;
  private ReviewerInfo reviewedBy;
  private String adminNotes;
  private Instant createdAt;
  private Instant updatedAt;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  @JsonInclude(JsonInclude.Include.NON_NULL)
  public static class ReporterInfo {

    private UUID id;
    private String fullName;
    private String email;
  }

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  @JsonInclude(JsonInclude.Include.NON_NULL)
  public static class ReviewerInfo {

    private UUID id;
    private String fullName;
  }
}
