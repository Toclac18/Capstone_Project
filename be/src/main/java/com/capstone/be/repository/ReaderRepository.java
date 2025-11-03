package com.capstone.be.repository;

import com.capstone.be.domain.entity.Reader;
import com.capstone.be.domain.enums.ReaderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReaderRepository extends JpaRepository<Reader, UUID> {

  boolean existsByEmail(String email);

  boolean existsByUsername(String username);

  Optional<Reader> findByEmail(String email);

  List<Reader> findByStatus(ReaderStatus status);

  Page<Reader> findByStatus(ReaderStatus status, Pageable pageable);

  Page<Reader> findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrUsernameContainingIgnoreCase(
          String fullName, String email, String username, Pageable pageable);
}
