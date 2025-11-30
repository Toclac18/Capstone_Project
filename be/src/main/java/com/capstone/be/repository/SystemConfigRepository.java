package com.capstone.be.repository;

import com.capstone.be.domain.entity.SystemConfig;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SystemConfigRepository extends JpaRepository<SystemConfig, UUID> {

  Optional<SystemConfig> findByConfigKey(String configKey);

  boolean existsByConfigKey(String configKey);
}

