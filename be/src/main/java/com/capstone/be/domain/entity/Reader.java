package com.capstone.be.domain.entity;

import com.capstone.be.domain.entity.common.BaseEntity;
import com.capstone.be.domain.enums.ReaderStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "readers")
@EqualsAndHashCode(callSuper = true)
@Data
public class Reader extends BaseEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(nullable = false)
  private String fullName;

  @Column(nullable = false, unique = true)
  private String username;

  @Column(nullable = false)
  private LocalDate dateOfBirth;

  @Column(nullable = false, unique = true)
  private String email;

  @Column(nullable = false)
  private String passwordHash;

  private String avatarUrl;

  @Column(nullable = false)
  private Integer point = 0;

  @Column(nullable = false)
  @Enumerated(EnumType.STRING)
  private ReaderStatus status = ReaderStatus.PENDING_VERIFICATION;

}
