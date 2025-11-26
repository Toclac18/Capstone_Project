package com.capstone.be.repository;

import com.capstone.be.domain.entity.Policy;
import com.capstone.be.domain.entity.PolicyAcceptance;
import com.capstone.be.domain.entity.User;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PolicyAcceptanceRepository extends JpaRepository<PolicyAcceptance, UUID> {

  Optional<PolicyAcceptance> findByPolicyAndUser(Policy policy, User user);

  boolean existsByPolicyAndUser(Policy policy, User user);
}

