package com.capstone.be.domain.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum DocType {

  EXAM("Exam Paper"),
  QUIZ("Quiz / Multiple Choice"),
  ASSIGNMENT("Assignment"),
  LECTURE_NOTE("Lecture Notes"),
  TEXTBOOK("Textbook"),
  RESEARCH_PAPER("Research Paper"),
  THESIS("Thesis / Dissertation"),

  REPORT("Report"),
  PRESENTATION("Presentation (Slides)"),
  FORM("Form"),
  TEMPLATE("Template"),

  ARTICLE("Article"),
  GUIDE("Guide"),
  MANUAL("Technical Manual"),

  OTHER("Other");

  private final String displayName;

}
