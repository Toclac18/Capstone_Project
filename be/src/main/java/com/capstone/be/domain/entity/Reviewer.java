package com.capstone.be.domain.entity;

import com.capstone.be.domain.entity.common.BaseEntity;
import com.capstone.be.domain.enums.EducationLevel;
import com.capstone.be.domain.enums.ReviewerStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import java.util.Set;
import java.util.UUID;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
@Entity
@Table(name = "reviewers")
public class Reviewer extends BaseEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(nullable = false)
  private String username;

  @Column(unique = true)
  private String email;

  @Column(nullable = false)
  private String passwordHash;

  @Column(nullable = false)
  private String fullName;

  @Column(nullable = false)
  private LocalDate dateOfBirth;

  private String ordid; //#temp, nullable

  @Column(nullable = false)
  @Enumerated(EnumType.STRING)
  private EducationLevel educationLevel;

  @Column(nullable = false)
  private String organizationName;

  @Column(nullable = false)
  private String organizationEmail;

  @NotNull
  @Enumerated(EnumType.STRING)
  ReviewerStatus status = ReviewerStatus.PENDING_VERIFICATION;

  @Column(nullable = false)
  private Boolean active = true;

  @Column(nullable = false)
  private Boolean deleted = false;

  @ManyToMany(mappedBy = "reviewers")
  private Set<Domain> domains;

  @ManyToMany(mappedBy = "reviewers")
  private Set<Specialization> reviewSpecializations;
}
