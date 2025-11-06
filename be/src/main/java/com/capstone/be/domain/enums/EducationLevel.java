package com.capstone.be.domain.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum EducationLevel {
  COLLEGE("College"),
  UNIVERSITY("University"),
  MASTER("Master's Degree"),
  DOCTORATE("Doctorate");

  private final String displayName;
}