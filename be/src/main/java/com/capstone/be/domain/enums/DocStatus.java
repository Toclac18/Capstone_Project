package com.capstone.be.domain.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum DocStatus {
  AI_VERIFYING("AI Verifying"),
  AI_VERIFIED("AI Verified"),
  AI_REJECTED("AI Rejected"),

  REVIEWING("Reviewing"),
  ACTIVE("Active"),   //Review Success
  REJECTED("Rejected"),
  
  INACTIVE("Inactive"),
  DELETED("Deleted");

  private final String displayName;
}
