package com.capstone.be.dto.request.document;

import com.capstone.be.domain.enums.DocStatus;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

/**
 * Filter criteria for document upload history view
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentUploadHistoryFilter {

  // Search by title or description
  private String searchKeyword;

  // Filter by premium
  private Boolean isPremium;

  // Filter by date range (createdAt)
  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
  private LocalDate dateFrom;

  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
  private LocalDate dateTo;

  // Filter by document type
  private UUID docTypeId;

  // Filter by domain
  private UUID domainId;

  // Filter by single document status
  private DocStatus status;

  // Filter by multiple document statuses (comma-separated string from frontend)
  private String statuses;

  /**
   * Parse statuses string into list of DocStatus
   */
  public List<DocStatus> getStatusList() {
    if (statuses == null || statuses.trim().isEmpty()) {
      return null;
    }
    try {
      return java.util.Arrays.stream(statuses.split(","))
          .map(String::trim)
          .filter(s -> !s.isEmpty())
          .map(DocStatus::valueOf)
          .toList();
    } catch (IllegalArgumentException e) {
      return null;
    }
  }
}
