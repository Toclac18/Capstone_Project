package com.capstone.be.dto.request.report;

import com.capstone.be.domain.enums.ReportReason;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateReportRequest {

  @NotNull(message = "Document ID is required")
  private UUID documentId;

  @NotNull(message = "Report reason is required")
  private ReportReason reason;

  @Size(max = 2000, message = "Description must not exceed 2000 characters")
  private String description;
}
