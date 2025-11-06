package com.capstone.be.repository;

import com.capstone.be.domain.entity.Organization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, UUID> {

    boolean existsByEmail(String email);

    Optional<Organization> findByAdminEmail(String adminEmail);
}
