package com.capstone.be.domain.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum PolicyStatus {
  ACTIVE("Active"),
  INACTIVE("Inactive");

  private final String displayName;
}

