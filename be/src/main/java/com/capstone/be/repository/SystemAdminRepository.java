package com.capstone.be.repository;

import com.capstone.be.domain.entity.SystemAdmin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface SystemAdminRepository extends JpaRepository<SystemAdmin, UUID> {

    boolean existsByEmail(String email);

    Optional<SystemAdmin> findByEmail(String email);
}
