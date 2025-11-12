package com.capstone.be.repository;

import com.capstone.be.domain.entity.Document;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DocumentRepository extends JpaRepository<Document, UUID> {

  // Statistics queries are handled in Service layer using repositories
}
