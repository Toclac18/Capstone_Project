package com.capstone.be.domain.entity;

import com.capstone.be.domain.entity.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "organizations")
@Data
@EqualsAndHashCode(callSuper = true)
public class Organization extends BaseEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(unique = true, nullable = false)
  private String email;

  @Column(unique = true, nullable = false)
  private String hotline;

  private String logo;

  private String address;

  @Column(nullable = false)
  private String status;  //#temp

  /* ORGANIZATION ADMIN */
  private String adminName;
  private String adminPassword;
  private String adminEmail;

  @Column(nullable = false)
  private Boolean active = true;

  @Column(nullable = false)
  private Boolean deleted = false;

}
