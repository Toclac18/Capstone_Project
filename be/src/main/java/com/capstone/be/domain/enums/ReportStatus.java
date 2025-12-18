package com.capstone.be.domain.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Status of a document report
 */
@Getter
@AllArgsConstructor
public enum ReportStatus {
  PENDING("Pending"),
  RESOLVED("Resolved");

  private final String displayName;
}
