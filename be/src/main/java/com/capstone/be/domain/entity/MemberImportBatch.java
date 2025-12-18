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
 * Entity representing a batch of member imports by organization admins
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(name = "member_import_batch")
public class MemberImportBatch extends BaseEntity {

  /**
   * Organization that imported members
   */
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "organization_id", nullable = false)
  private OrganizationProfile organization;

  /**
   * Admin who performed the import
   */
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "admin_id", nullable = false)
  private User admin;

  /**
   * Import source: MANUAL or EXCEL
   */
  @Column(nullable = false, length = 20)
  private String importSource;

  /**
   * Total number of emails in the import request
   */
  @Column(nullable = false)
  private Integer totalEmails;

  /**
   * Number of successfully invited members
   */
  @Column(nullable = false)
  private Integer successCount;

  /**
   * Number of failed invitations
   */
  @Column(nullable = false)
  private Integer failedCount;

  /**
   * Number of skipped invitations (already invited/joined)
   */
  @Column(nullable = false)
  private Integer skippedCount;

  /**
   * S3 URL of the uploaded Excel file (nullable for manual imports)
   */
  @Column(length = 1000)
  private String fileKey;

  /**
   * Original file name of the uploaded Excel file
   */
  @Column(length = 255)
  private String fileName;

  /**
   * Additional notes or error summary
   */
  @Column(columnDefinition = "TEXT")
  private String notes;
}
