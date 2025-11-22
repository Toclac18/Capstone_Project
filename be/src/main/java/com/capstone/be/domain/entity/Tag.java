package com.capstone.be.domain.entity;

import com.capstone.be.domain.entity.common.BaseEntity;
import com.capstone.be.domain.enums.TagStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import lombok.AllArgsConstructor;
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
public class Tag extends BaseEntity {

  @Column(
      nullable = false,
      unique = true,
      updatable = false,
      insertable = false,
      columnDefinition = "bigint generated always as identity"
  )
  private Long code;

  @Column(nullable = false, unique = true)
  private String name;

  @Column(nullable = false, unique = true)
  private String normalizedName;

  @Column(nullable = false)
  @Enumerated(EnumType.STRING)
  private TagStatus status;

  @PrePersist
  @PreUpdate
  private void normalize() {
    if (this.name != null) {
      this.normalizedName = this.name.toLowerCase()
          .replaceAll("[^a-z0-9]", "");
    }
  }
}

