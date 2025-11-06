package com.capstone.be.repository;

import com.capstone.be.domain.entity.Organization;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface OrganizationRepository extends JpaRepository<Organization, UUID> {

  boolean existsByEmail(String email);

  boolean existsByName(String name);

  Optional<Organization> findByAdminEmail(String adminEmail);

  Optional<Organization> findByEmail(String email);

  @Modifying
  @Query("UPDATE Organization o SET o.status = DELETED WHERE o.id = :id")
  int softDeleteById(@Param("id") UUID id);
}
