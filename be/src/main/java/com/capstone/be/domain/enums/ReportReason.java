package com.capstone.be.domain.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Reasons for reporting a document
 */
@Getter
@AllArgsConstructor
public enum ReportReason {
  INAPPROPRIATE_CONTENT("Inappropriate Content"),
  COPYRIGHT_VIOLATION("Copyright Violation"),
  SPAM("Spam"),
  MISLEADING_INFORMATION("Misleading Information"),
  DUPLICATE_CONTENT("Duplicate Content"),
  QUALITY_ISSUES("Quality Issues"),
  OTHER("Other");

  private final String displayName;
}
