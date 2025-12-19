package com.capstone.be.domain.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum OrgEnrollStatus {
  PENDING_INVITE("Pending invite"),
  JOINED("Joined"),
  LEFT("Left"),
  REMOVED("Removed");

  private final String displayName;
}
