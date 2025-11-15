package com.capstone.be.domain.entity;

import com.capstone.be.domain.entity.common.TimestampEntity;
import com.capstone.be.domain.enums.EducationLevel;
import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
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
public class ReviewerProfile extends TimestampEntity {

  @Id
  @UuidGenerator
  @Column(columnDefinition = "UUID")
  private UUID id;

  @OneToOne
  @JoinColumn(name = "user_id", nullable = false, unique = true)
  private User user;

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

  // Credential file URLs stored in S3
  @ElementCollection
  @CollectionTable(name = "reviewer_credentials", joinColumns = @JoinColumn(name = "reviewer_profile_id"))
  @Column(name = "file_url")
  @Builder.Default
  private List<String> credentialFileUrls = new ArrayList<>();

}
