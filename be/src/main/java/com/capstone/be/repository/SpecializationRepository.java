package com.capstone.be.repository;

import com.capstone.be.domain.entity.Specialization;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface SpecializationRepository extends JpaRepository<Specialization, UUID>,
    JpaSpecificationExecutor<Specialization> {

  List<Specialization> findAllByIdIn(List<UUID> ids);

  /**
   * Find specializations by domain ID
   */
  List<Specialization> findByDomain_Id(UUID domainId);

  boolean existsByNameIgnoreCaseAndDomain_Id(String name, UUID domainId);

  boolean existsByNameIgnoreCaseAndDomain_IdAndIdNot(String name, UUID domainId, UUID id);

  boolean existsByCodeAndDomain_Id(Integer code, UUID domainId);

  boolean existsByCodeAndDomain_IdAndIdNot(Integer code, UUID domainId, UUID id);
}
