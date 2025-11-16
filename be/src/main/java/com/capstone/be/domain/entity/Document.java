package com.capstone.be.domain.entity;

import com.capstone.be.domain.entity.common.BaseEntity;
import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.DocType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
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
public class Document extends BaseEntity {

  @Column(nullable = false)
  private String title;

  @Column(nullable = false)
  private String description;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "uploader_id") //user_id
  private User uploader;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "organization_id")
  private OrganizationProfile organization;  //optional

  private Boolean isPublic;

  @Column(name = "type_id")
  private DocType type;

  private Boolean isPremium;

  private Integer price;

  private String thumbnail;

  private String fileName;

  private String pageCount;

  @Column(nullable = false)
  @Enumerated(EnumType.STRING)
  private DocStatus status;

  // -- Denormalized fields
  @Builder.Default
  private Integer viewCount = 0;

  @Builder.Default
  private Integer upvoteCount = 0;

  @Builder.Default
  private Integer voteScore = 0; //can calculate downvoteCount
  // Denormalized fields --

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "specialization_id")
  private Specialization specialization;


}
