package com.capstone.be.repository;

import com.capstone.be.domain.entity.Reader;
import com.capstone.be.domain.enums.ReaderStatus;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface ReaderRepository extends JpaRepository<Reader, UUID> {

  boolean existsByEmail(String email);

  boolean existsByUsername(String username);

  Optional<Reader> findByEmail(String email);

  List<Reader> findByStatus(ReaderStatus status);

  Page<Reader> findByStatus(ReaderStatus status, Pageable pageable);

  Page<Reader> findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrUsernameContainingIgnoreCase(
      String fullName, String email, String username, Pageable pageable);

  @Modifying
  @Query("UPDATE Reader r SET r.status = DELETED WHERE r.id = :id")
  int softDeleteById(@Param("id") UUID id);

  @Query("""
        SELECT r FROM Reader r
        WHERE (:q IS NULL OR :q = '' OR LOWER(r.fullName) LIKE LOWER(CONCAT('%', :q, '%')))
          AND (:status IS NULL OR r.status = :status)
      """)
  Page<Reader> search(@Param("q") String q,
      @Param("status") ReaderStatus status,
      Pageable pageable);

}
