package com.capstone.be.domain.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Enum representing the decision made by a reviewer on a document
 */
@Getter
@AllArgsConstructor
public enum ReviewDecision {
  APPROVED("Approved"),
  REJECTED("Rejected");

  private final String displayName;
}
