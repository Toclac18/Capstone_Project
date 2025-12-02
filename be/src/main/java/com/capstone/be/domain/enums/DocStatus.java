package com.capstone.be.domain.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum DocStatus {
  VERIFYING("Verifying"),
  VERIFIED("Verified"),
  REJECTED("Rejected"),
  ACTIVE("Active"),
  INACTIVE("Inactive"),
  DELETED("Deleted");

  private final String displayName;
}
