package com.capstone.be.repository;

import com.capstone.be.domain.entity.Reader;
import java.util.Optional;
import java.util.UUID;
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

  @Modifying
  @Query("UPDATE Reader r SET r.status = DELETED WHERE r.id = :id")
  int softDeleteById(@Param("id") UUID id);

}
