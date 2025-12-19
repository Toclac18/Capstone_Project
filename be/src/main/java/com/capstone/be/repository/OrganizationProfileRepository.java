package com.capstone.be.repository;

import com.capstone.be.domain.entity.OrganizationProfile;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface OrganizationProfileRepository extends
    JpaRepository<OrganizationProfile, UUID>, JpaSpecificationExecutor<OrganizationProfile> {

  Optional<OrganizationProfile> findByEmail(String email);

  Optional<OrganizationProfile> findByAdminId(UUID adminId);

  // Alias for findByAdminId (for consistency with other profile repositories)
  default Optional<OrganizationProfile> findByUserId(UUID userId) {
    return findByAdminId(userId);
  }

  boolean existsByName(String name);

  boolean existsByEmail(String email);

  boolean existsByRegistrationNumber(String registrationNumber);
}
