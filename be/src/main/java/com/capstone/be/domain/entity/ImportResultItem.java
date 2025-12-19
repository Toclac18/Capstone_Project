package com.capstone.be.domain.entity;

import com.capstone.be.domain.entity.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * Entity to store individual import result items for each email in a batch
 * Stores SUCCESS, FAILED, SKIPPED results
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(name = "import_result_items")
public class ImportResultItem extends BaseEntity {

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "import_batch_id", nullable = false)
  private MemberImportBatch importBatch;

  @Column(nullable = false)
  private String email;

  /**
   * Status: SUCCESS, FAILED, SKIPPED
   */
  @Column(nullable = false, length = 20)
  private String status;

  /**
   * Reason for failed/skipped (null for success)
   */
  @Column(length = 500)
  private String reason;
}
