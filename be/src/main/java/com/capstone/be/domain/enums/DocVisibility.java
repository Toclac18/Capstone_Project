package com.capstone.be.domain.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Document visibility levels
 */
@Getter
@AllArgsConstructor
public enum DocVisibility {
  PUBLIC("Public"),           // Everyone can see
  INTERNAL("Internal"),       // Only organization members can see
  PRIVATE("Private");         // Only uploader can see

  private final String displayName;
}
