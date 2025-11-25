package com.capstone.be.dto.request.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Simplified filter criteria for document library view
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentLibraryFilter {

  // Search by title or description
  private String searchKeyword;

  // Filter by premium
  private Boolean isPremium;

  // Filter by ownership
  private Boolean isOwned; // Documents uploaded by user
  private Boolean isPurchased; // Documents purchased by user
}
