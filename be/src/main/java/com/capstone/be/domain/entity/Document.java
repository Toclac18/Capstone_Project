package com.capstone.be.domain.entity;

import com.capstone.be.domain.entity.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToMany;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Entity
@Table(name = "documents")
@EqualsAndHashCode(callSuper = true)
@Data
public class Document extends BaseEntity {

  @Id
  @GeneratedValue(strategy = GenerationType.UUID)
  private UUID id;

  @Column(nullable = false)
  private String title;

  @Column()
  private String description;

  @ManyToOne
  @JoinColumn(name = "uploader_id")
  private Reader uploader;

  @ManyToOne
  @JoinColumn(name = "organization_id")
  private Organization organization;

  @ManyToOne
  @JoinColumn(name = "type_id")
  private DocumentType type;

  private Boolean isPublic;

  private Boolean isPremium;

  private Integer price;

  private Integer viewCount;

  private String file_name;

  private Boolean deleted;

  @ManyToMany(mappedBy = "documents")
  private Set<Specialization> specializations = new HashSet<>();

}
