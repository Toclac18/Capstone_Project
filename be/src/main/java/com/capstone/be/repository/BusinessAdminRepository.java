package com.capstone.be.repository;

import com.capstone.be.domain.entity.BusinessAdmin;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface BusinessAdminRepository extends JpaRepository<BusinessAdmin, Long> {

  Optional<BusinessAdmin> findByEmail(String email);
}
