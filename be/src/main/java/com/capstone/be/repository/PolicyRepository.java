package com.capstone.be.repository;

import com.capstone.be.domain.entity.Policy;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PolicyRepository extends JpaRepository<Policy, UUID> {

  Optional<Policy> findByVersion(String version);

  Optional<Policy> findByIsActive(boolean isActive);

  List<Policy> findAllByIsActive(boolean isActive);

  boolean existsByVersion(String version);

  // Get all policies ordered by creation date (newest first)
  List<Policy> findAllByOrderByCreatedAtDesc();
}

