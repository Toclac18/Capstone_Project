package com.capstone.be.dto.request.review;

import com.capstone.be.domain.enums.ReviewDecision;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;
import java.util.UUID;

/**
 * Request DTO for filtering review history
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewHistoryFilterRequest {

  /**
   * Filter by review decision (APPROVED or REJECTED)
   */
  private ReviewDecision decision;

  /**
   * Filter by submitted date from (inclusive)
   */
  private Instant dateFrom;

  /**
   * Filter by submitted date to (inclusive)
   */
  private Instant dateTo;

  /**
   * Filter by document type ID
   */
  private UUID docTypeId;

  /**
   * Filter by domain ID
   */
  private UUID domainId;
}
