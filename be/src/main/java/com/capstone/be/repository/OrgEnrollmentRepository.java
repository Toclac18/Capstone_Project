package com.capstone.be.repository;

import com.capstone.be.domain.entity.OrgEnrollment;
import com.capstone.be.domain.entity.OrganizationProfile;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.OrgEnrollStatus;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface OrgEnrollmentRepository extends JpaRepository<OrgEnrollment, UUID>,
    JpaSpecificationExecutor<OrgEnrollment> {

  /**
   * Find enrollment by organization and member
   */
  Optional<OrgEnrollment> findByOrganizationAndMember(
      OrganizationProfile organization,
      User member
  );

  /**
   * Find enrollment by organization and member email
   */
  Optional<OrgEnrollment> findByOrganizationAndMemberEmail(
      OrganizationProfile organization,
      String memberEmail
  );

  Set<OrgEnrollment> findByOrganizationAndMemberEmailIn(
      OrganizationProfile org, List<String> emails);

  /**
   * Find all enrollments for an organization with optional status filter
   */
  Page<OrgEnrollment> findByOrganization(
      OrganizationProfile organization,
      Pageable pageable
  );

  /**
   * Find enrollments by organization and status
   */
  Page<OrgEnrollment> findByOrganizationAndStatus(
      OrganizationProfile organization,
      OrgEnrollStatus status,
      Pageable pageable
  );

  /**
   * Find all enrollments for a member (reader)
   */
  Page<OrgEnrollment> findByMember(User member, Pageable pageable);

  /**
   * Find enrollments by member and status
   */
  Page<OrgEnrollment> findByMemberAndStatus(
      User member,
      OrgEnrollStatus status,
      Pageable pageable
  );

  /**
   * Check if enrollment exists for organization and member
   */
  boolean existsByOrganizationAndMember(
      OrganizationProfile organization,
      User member
  );

  /**
   * Check if enrollment exists for organization and member email
   */
  boolean existsByOrganizationAndMemberEmail(
      OrganizationProfile organization,
      String memberEmail
  );

  /**
   * Count enrollments by organization and status
   */
  long countByOrganizationAndStatus(
      OrganizationProfile organization,
      OrgEnrollStatus status
  );

  /**
   * Delete all enrollments for an organization
   */
  void deleteByOrganization(OrganizationProfile organization);
}
