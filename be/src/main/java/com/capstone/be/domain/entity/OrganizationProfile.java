package com.capstone.be.domain.entity;

import com.capstone.be.domain.entity.common.TimestampEntity;
import com.capstone.be.domain.enums.OrgType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.UuidGenerator;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
public class OrganizationProfile extends TimestampEntity {

  @Id
  @UuidGenerator
  @Column(columnDefinition = "UUID")
  private UUID id;

  @OneToOne
  @JoinColumn(name = "user_id", nullable = false, unique = true)
  private User admin; //Admin

  @Column(unique = true, nullable = false)
  private String name;

  @Column(nullable = false)
  @Enumerated(EnumType.STRING)
  private OrgType type;

  @Column(unique = true, nullable = false)
  private String email;

  @Column(nullable = false)
  private String hotline;

  private String logo;

  @Column(nullable = false)
  private String address;

  @Column(nullable = false)
  private String registrationNumber;

}
