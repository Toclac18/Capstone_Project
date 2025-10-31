package com.capstone.be.domain.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum EducationLevel {
  HIGH_SCHOOL("High School"),
  COLLEGE("College"),
  UNIVERSITY("University"),
  MASTER("Master's Degree"),
  DOCTORATE("Doctorate");

  private final String displayName;
}