package com.capstone.be.repository;

import com.capstone.be.domain.entity.Domain;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface DomainRepository extends JpaRepository<Domain, UUID>,
    JpaSpecificationExecutor<Domain> {

  List<Domain> findAllByIdIn(List<UUID> ids);
}
