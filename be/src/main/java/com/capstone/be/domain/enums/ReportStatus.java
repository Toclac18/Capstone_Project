package com.capstone.be.domain.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Status of a document report
 */
@Getter
@AllArgsConstructor
public enum ReportStatus {
  PENDING("Pending Review"),
  IN_REVIEW("In Review"),
  RESOLVED("Resolved"),
  REJECTED("Rejected"),
  CLOSED("Closed");

  private final String displayName;
}
