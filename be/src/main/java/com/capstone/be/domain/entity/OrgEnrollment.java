package com.capstone.be.domain.entity;

import com.capstone.be.domain.entity.common.BaseEntity;
import com.capstone.be.domain.enums.OrgEnrollStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * Entity to track organization member enrollments Manages invitations and membership for readers in
 * organizations
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(name = "org_enrollments", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"organization_id", "member_id"})
})
public class OrgEnrollment extends BaseEntity {

  /**
   * Organization that this enrollment belongs to
   */
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "organization_id", nullable = false)
  private OrganizationProfile organization;

  /**
   * User (Reader) who is invited/enrolled
   */
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "member_id", nullable = false)
  private User member;

  /**
   * Enrollment status: PENDING_INVITE, JOINED, REMOVED
   */
  @Column(nullable = false)
  @Enumerated(EnumType.STRING)
  private OrgEnrollStatus status;

  /**
   * Email of the invited member (for tracking before acceptance)
   */
  @Column(nullable = false)
  private String memberEmail;

  /**
   * Import batch that this enrollment was created from (nullable for manual invites)
   */
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "import_batch_id")
  private MemberImportBatch importBatch;

  /**
   * Domain methods
   */
  public boolean isPending() {
    return status == OrgEnrollStatus.PENDING_INVITE;
  }

  public boolean isJoined() {
    return status == OrgEnrollStatus.JOINED;
  }

  public boolean isRemoved() {
    return status == OrgEnrollStatus.REMOVED;
  }

  public void acceptInvitation() {
    this.status = OrgEnrollStatus.JOINED;
  }

  public void rejectInvitation() {
    this.status = OrgEnrollStatus.REMOVED;
  }

  public void removeMember() {
    this.status = OrgEnrollStatus.REMOVED;
  }
}
