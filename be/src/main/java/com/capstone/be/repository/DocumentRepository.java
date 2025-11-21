package com.capstone.be.repository;

import com.capstone.be.domain.entity.Document;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface DocumentRepository extends JpaRepository<Document, UUID>,
    JpaSpecificationExecutor<Document> {

  long countByOrganizationId(UUID organizationId);
}
