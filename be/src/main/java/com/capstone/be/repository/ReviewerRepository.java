package com.capstone.be.repository;

import com.capstone.be.domain.entity.Reviewer;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReviewerRepository extends JpaRepository<Reviewer, Long> {

  Optional<Reviewer> findByEmail(String email);
}
