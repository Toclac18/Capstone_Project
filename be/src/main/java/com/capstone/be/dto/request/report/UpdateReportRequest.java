package com.capstone.be.dto.request.report;

import com.capstone.be.domain.enums.ReportStatus;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateReportRequest {

  private ReportStatus status;

  @Size(max = 2000, message = "Admin notes must not exceed 2000 characters")
  private String adminNotes;
}
