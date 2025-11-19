package com.capstone.be.domain.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum OrgType {
  SCHOOL("School"),
  COLLEGE("College"),
  UNIVERSITY("University"),
  TRAINING_CENTER("Training Center");

  private final String displayName;

}
