package com.capstone.be.repository;

import com.capstone.be.domain.entity.Reader;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReaderRepository extends JpaRepository<Reader, UUID> {

  boolean existsByEmail(String email);

  boolean existsByUsername(String username);

  Optional<Reader> findByEmail(String email);
}
