package com.capstone.be.dto.response.review;

import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.ReviewDecision;
import com.capstone.be.domain.enums.ReviewRequestStatus;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO representing one row in Business Admin Review Management table.
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewManagementItem {

  private UUID documentId;
  private String title;
  private DocStatus documentStatus;
  private Boolean isPremium;
  private String specializationName;

  private UUID reviewRequestId;
  private ReviewRequestStatus reviewRequestStatus;
  private UUID reviewerId;
  private String reviewerName;
  private String reviewerEmail;

  private Instant responseDeadline;
  private Instant reviewDeadline;

  /**
   * Decision from review result, only meaningful for COMPLETED tab.
   */
  private ReviewDecision decision;

  private Instant createdAt;
  private Instant updatedAt;
}


