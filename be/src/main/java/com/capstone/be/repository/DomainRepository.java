package com.capstone.be.repository;

import com.capstone.be.domain.entity.Domain;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DomainRepository extends JpaRepository<Domain, UUID> {

  @Query("select d.id from Domain d where d.id in :ids")
  Set<UUID> findExistingIds(@Param("ids") Set<UUID> ids);

  long countByIdIn(Set<UUID> ids);
}
