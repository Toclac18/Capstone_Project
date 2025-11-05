package com.capstone.be.repository;

import com.capstone.be.domain.entity.Organization;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, UUID> {

  boolean existsByEmail(String email);

  boolean existsByName(String name);

  Optional<Organization> findByAdminEmail(String adminEmail);

  Optional<Organization> findByEmail(String email);
}
