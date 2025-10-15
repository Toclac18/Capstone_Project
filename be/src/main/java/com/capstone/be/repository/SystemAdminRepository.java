package com.capstone.be.repository;

import com.capstone.be.domain.entity.SystemAdmin;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SystemAdminRepository extends JpaRepository<SystemAdmin, Long> {

  Optional<SystemAdmin> findByEmail(String email);
}
