package com.capstone.be.repository;

import com.capstone.be.domain.entity.Reviewer;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewerRepository extends JpaRepository<Reviewer, UUID> {

  boolean existsByEmail(String email);

  boolean existsByUsername(String username);

  Optional<Reviewer> findByEmail(String email);
}
