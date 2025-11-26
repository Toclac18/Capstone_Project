package com.capstone.be.dto.request.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
}
