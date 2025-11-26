package com.capstone.be.repository;

import com.capstone.be.domain.entity.Policy;
import com.capstone.be.domain.enums.PolicyStatus;
import com.capstone.be.domain.enums.PolicyType;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PolicyRepository extends JpaRepository<Policy, UUID> {

  Optional<Policy> findByType(PolicyType type);

  Optional<Policy> findByTypeAndStatus(PolicyType type, PolicyStatus status);

  List<Policy> findAllByStatus(PolicyStatus status);

  boolean existsByType(PolicyType type);
}

