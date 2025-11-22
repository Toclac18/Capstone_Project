package com.capstone.be.repository;

import com.capstone.be.domain.entity.MemberImportBatch;
import com.capstone.be.domain.entity.OrganizationProfile;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/**
 * Repository for MemberImportBatch entity
 */
@Repository
public interface MemberImportBatchRepository extends JpaRepository<MemberImportBatch, UUID> {

  /**
   * Find all import batches for an organization with pagination
   *
   * @param organization Organization
   * @param pageable     Pagination parameters
   * @return Page of import batches
   */
  Page<MemberImportBatch> findByOrganizationOrderByCreatedAtDesc(
      OrganizationProfile organization,
      Pageable pageable
  );
}
