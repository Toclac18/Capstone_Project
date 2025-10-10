package com.capstone.be.repository;

import com.capstone.be.domain.entity.Reader;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReaderRepository extends JpaRepository<Reader, Long> {

  boolean existsByEmail(String email);

  Optional<Reader> findByEmail(String email);
}
