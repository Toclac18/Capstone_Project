package com.capstone.be.domain.entity;

import com.capstone.be.domain.entity.common.BaseEntity;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import java.util.HashSet;
import java.util.Set;
import lombok.AllArgsConstructor;
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
@Table(name = "saved_list")
public class SavedList extends BaseEntity {

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "reader_id", nullable = false)
  private ReaderProfile reader;

  @Column(nullable = false)
  private String name;

  @OneToMany(mappedBy = "savedList", fetch = FetchType.LAZY, cascade = CascadeType.ALL, orphanRemoval = true)
  @lombok.Builder.Default
  private Set<SavedListDocument> savedListDocuments = new HashSet<>();
}
