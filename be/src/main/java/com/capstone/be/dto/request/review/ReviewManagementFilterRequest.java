package com.capstone.be.dto.request.review;

import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Filter request for Business Admin Review Management screen.
 * This mirrors the tabs and filters currently used on the frontend.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewManagementFilterRequest {

  /**
   * Tab identifier:
   * - NEEDS_ASSIGNMENT
   * - PENDING
   * - IN_REVIEW
   * - COMPLETED
   * - ALL
   */
  private String tab;

  /**
   * Optional filter by reviewer (userId of reviewer).
   */
  private UUID reviewerId;

  /**
   * Optional filter by domain name.
   * Frontend currently uses specializationName prefix as domain label,
   * but backend can use specialization.domain.name for accurate filter.
   */
  private String domain;

  /**
   * Optional search text (document title).
   */
  private String search;

  /**
   * Sort field:
   * - createdAt
   * - title
   * - deadline
   */
  private String sortBy;

  /**
   * Sort direction: asc / desc.
   */
  private String sortOrder;
}


