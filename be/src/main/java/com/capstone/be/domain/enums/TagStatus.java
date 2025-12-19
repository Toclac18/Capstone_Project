package com.capstone.be.domain.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Tag status for admin approval
 */
@Getter
@AllArgsConstructor
public enum TagStatus {
  ACTIVE("Active"),       // Approved and active
  PENDING("Pending"),     // Waiting for admin approval
  REJECTED("Rejected");   // Rejected by admin

  private final String displayName;
}
