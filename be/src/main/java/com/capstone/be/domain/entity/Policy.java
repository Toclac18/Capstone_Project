package com.capstone.be.domain.entity;

import com.capstone.be.domain.entity.common.BaseEntity;
import com.capstone.be.domain.enums.PolicyStatus;
import com.capstone.be.domain.enums.PolicyType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(
    name = "policies",
    uniqueConstraints = {
        @UniqueConstraint(columnNames = "type")
    }
)
public class Policy extends BaseEntity {

  @Enumerated(EnumType.STRING)
  @Column(nullable = false, unique = true, updatable = false)
  private PolicyType type;

  @Column(nullable = false)
  private String title;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String content; // HTML content

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  @Builder.Default
  private PolicyStatus status = PolicyStatus.ACTIVE;

  @Column(nullable = false)
  @Builder.Default
  private Boolean isRequired = false; // User must accept before using system
}

