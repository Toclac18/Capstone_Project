package com.capstone.be.dto.request.document;

import java.time.LocalDate;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;

/**
 * Filter criteria for document library view
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

  // Filter by date range (createdAt)
  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
  private LocalDate dateFrom;

  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
  private LocalDate dateTo;

  // Filter by document type
  private UUID docTypeId;

  // Filter by domain
  private UUID domainId;
}
