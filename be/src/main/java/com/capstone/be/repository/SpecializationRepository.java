package com.capstone.be.repository;

import com.capstone.be.domain.entity.Specialization;
import java.util.Set;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SpecializationRepository extends JpaRepository<Specialization, UUID> {

  @Query("select s.id from Specialization s where s.id in :ids")
  Set<UUID> findExistingIds(@Param("ids") Set<UUID> ids);

  @Query("select s.id from Specialization s " +
      "where s.id in :specIds and s.domain.id not in :domainIds")
  Set<UUID> findIdsNotBelongingToDomains(@Param("specIds") Set<UUID> specIds,
      @Param("domainIds") Set<UUID> domainIds);

}
