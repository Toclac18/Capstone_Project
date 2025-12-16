package com.capstone.be.domain.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Status of review result after reviewer submits
 * BA will approve or reject the review result
 */
@Getter
@AllArgsConstructor
public enum ReviewResultStatus {
  PENDING("Pending"),     // Chờ BA duyệt kết quả review
  APPROVED("Approved"),   // BA đồng ý với kết quả review
  REJECTED("Rejected");   // BA không đồng ý, yêu cầu reviewer review lại

  private final String displayName;
}
