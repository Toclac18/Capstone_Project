package com.capstone.be.domain.entity;

import com.capstone.be.domain.entity.common.BaseEntity;
import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.DocVisibility;
import jakarta.persistence.*;
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
  @JoinColumn(name = "uploader_id")
  private User uploader;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "organization_id")
  private OrganizationProfile organization;  // Optional - null means system-wide document

  @Column(nullable = false)
  @Enumerated(EnumType.STRING)
  @Builder.Default
  private DocVisibility visibility = DocVisibility.PUBLIC;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "doc_type_id")
  private DocType docType;

  private Boolean isPremium;

  private Integer price;  // System will set fixed price for premium docs

  private String thumbnailKey;

  private String fileKey;

  private int pageCount;

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

  @Embedded
  private DocumentSummarization summarizations;
}
