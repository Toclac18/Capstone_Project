package com.capstone.be.repository;

import com.capstone.be.domain.entity.DocumentTag;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DocumentTagRepository extends JpaRepository<DocumentTag, UUID> {

  @Query("SELECT dt FROM DocumentTag dt JOIN dt.documents d WHERE d.id = :documentId")
  List<DocumentTag> findByDocumentId(@Param("documentId") UUID documentId);
}

