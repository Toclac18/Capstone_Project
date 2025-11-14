package com.capstone.be.domain.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum UserRole {
  READER("Reader"),
  REVIEWER("Reviewer"),
  ORGANIZATION_ADMIN("Organization Admin"),
  BUSINESS_ADMIN("Business admin"),
  SYSTEM_ADMIN("System admin");

  private final String displayName;
}
