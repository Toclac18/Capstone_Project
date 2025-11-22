package com.capstone.be.domain.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum PolicyType {
  TERMS_OF_SERVICE("Terms of Service"),
  PRIVACY_POLICY("Privacy Policy"),
  COOKIE_POLICY("Cookie Policy"),
  ACCEPTABLE_USE("Acceptable Use"),
  REFUND_POLICY("Refund Policy"),
  COPYRIGHT_POLICY("Copyright Policy"),
  COMMUNITY_GUIDELINES("Community Guidelines");

  private final String displayName;
}

