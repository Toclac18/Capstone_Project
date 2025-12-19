package com.capstone.be.domain.entity;

import com.capstone.be.domain.entity.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
        @UniqueConstraint(columnNames = "version")
    }
)
public class Policy extends BaseEntity {

  @Column(nullable = false, unique = true, updatable = false, length = 50)
  private String version; // e.g., "1.0", "2.0", "v1", "v2"

  @Column(nullable = false, length = 255)
  private String title;

  @Column(nullable = false, columnDefinition = "TEXT")
  private String content; // HTML content

  @Column(name = "is_active", nullable = false)
  @Builder.Default
  private Boolean isActive = false; // Only one policy can be active at a time
}

