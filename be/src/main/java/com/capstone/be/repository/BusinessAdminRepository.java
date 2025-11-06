package com.capstone.be.repository;

import com.capstone.be.domain.entity.BusinessAdmin;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface BusinessAdminRepository extends JpaRepository<BusinessAdmin, UUID> {

    boolean existsByEmail(String email);

    Optional<BusinessAdmin> findByEmail(String email);
}
