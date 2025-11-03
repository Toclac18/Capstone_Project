package com.capstone.be.domain.entity;

import com.capstone.be.domain.entity.common.BaseEntity;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.JoinTable;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.Table;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@EqualsAndHashCode(callSuper = true)
@Entity
@Table(name = "domains")
public class Domain extends BaseEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  private int code;

  private String name;

  @ManyToMany(fetch = FetchType.LAZY)
  @JoinTable(name = "reviewer_domain_n_n",
      joinColumns = @JoinColumn(name = "domain_id"),
      inverseJoinColumns = @JoinColumn(name = "reviewer_id"))
  private Set<Reviewer> reviewers = new HashSet<>();
}
