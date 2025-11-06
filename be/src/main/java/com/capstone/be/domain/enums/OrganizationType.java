package com.capstone.be.domain.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum OrganizationType {
  TYPE1("Type 1"),
  TYPE2("Type 2"),
  TYPE3("Type 3"); //#temp

  private final String displayName;
}
