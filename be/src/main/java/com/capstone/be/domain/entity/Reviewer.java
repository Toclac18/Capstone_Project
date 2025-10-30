package com.capstone.be.domain.entity;

import com.capstone.be.domain.entity.common.BaseEntity;
import com.capstone.be.domain.enums.ReviewerStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
@Entity
@Table(name = "reviewers")
public class Reviewer extends BaseEntity {

  ReviewerStatus status;
  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;
  private String name;
  @Column(unique = true)
  private String email;
  @Column(nullable = false)
  private String passwordHash;
  private String ordid; //#temp
  @Column(nullable = false)
  private Boolean active = true;

  @Column(nullable = false)
  private Boolean deleted = false;
}
