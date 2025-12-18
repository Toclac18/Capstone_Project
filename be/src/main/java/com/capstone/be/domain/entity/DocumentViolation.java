package com.capstone.be.domain.entity;

import com.capstone.be.domain.entity.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * Document violation entity - tracks AI moderation violations found in documents
 */
@Entity
@Table(name = "document_violations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
public class DocumentViolation extends BaseEntity {

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "document_id", nullable = false)
  private Document document;

  @Column(nullable = false, length = 20)
  private String type; // "text" or "image"

  @Column(columnDefinition = "TEXT")
  private String snippet; // For text violations, the offending text snippet

  @Column(nullable = false)
  private Integer page; // Page number where violation was found

  @Column(length = 50)
  private String prediction; // e.g., "toxic"

  @Column
  private Double confidence; // Confidence score from AI (0.0 to 1.0)
}
