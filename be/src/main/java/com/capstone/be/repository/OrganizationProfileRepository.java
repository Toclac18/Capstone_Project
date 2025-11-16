package com.capstone.be.repository;

import com.capstone.be.domain.entity.OrganizationProfile;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrganizationProfileRepository extends
    JpaRepository<OrganizationProfile, UUID> {

  Optional<OrganizationProfile> findByAdminId(UUID adminId);

  boolean existsByName(String name);

  boolean existsByEmail(String email);

  boolean existsByRegistrationNumber(String registrationNumber);
}
