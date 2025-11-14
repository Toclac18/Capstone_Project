package com.capstone.be.domain.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum UserStatus {
  PENDING_EMAIL_VERIFY("Pending email verify"),
  PENDING_APPROVE("Pending approve"),
  ACTIVE("Active"),
  INACTIVE("Inactive"),
  DELETED("Deleted");

  private final String displayName;
}

