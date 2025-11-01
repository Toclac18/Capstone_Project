package com.capstone.be.domain.entity;

import com.capstone.be.domain.entity.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import lombok.Data;
import lombok.EqualsAndHashCode;

@EqualsAndHashCode(callSuper = true)
@Data
@Entity
@Table(name = "specializations")
public class Specialization extends BaseEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  private int code;

  @Column(nullable = false, unique = true)
  private String name;

  @ManyToOne
  @JoinColumn(name = "domain_id")
  private Domain domain;

  @ManyToMany
  @JoinTable(name = "document_specialization_n_n",
      joinColumns = @JoinColumn(name = "specialization_id"),
      inverseJoinColumns = @JoinColumn(name = "document_id"))
  private Set<Document> documents = new HashSet<>();

  @ManyToMany
  @JoinTable(name = "reviewer_specialization_n_n",
      joinColumns = @JoinColumn(name = "specialization_id"),
      inverseJoinColumns = @JoinColumn(name = "reviewer_id"))
  private Set<Reviewer> reviewers = new HashSet<>();

}
