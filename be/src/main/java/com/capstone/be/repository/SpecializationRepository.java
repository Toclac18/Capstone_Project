package com.capstone.be.repository;

import com.capstone.be.domain.entity.Specialization;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SpecializationRepository extends JpaRepository<Specialization, UUID> {

  List<Specialization> findAllByIdIn(List<UUID> ids);

  /**
   * Find specializations by domain ID
   */
  List<Specialization> findByDomain_Id(UUID domainId);
}
