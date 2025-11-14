package com.capstone.be.repository;

import com.capstone.be.domain.entity.ReaderProfile;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ReaderProfileRepository extends JpaRepository<ReaderProfile, UUID> {

  Optional<ReaderProfile> findByUserId(UUID userId);
}
