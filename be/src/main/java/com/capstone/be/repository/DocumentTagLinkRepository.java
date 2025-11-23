package com.capstone.be.repository;

import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.DocumentTagLink;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DocumentTagLinkRepository extends JpaRepository<DocumentTagLink, UUID> {

  List<DocumentTagLink> findByDocument(Document document);

  List<DocumentTagLink> findByDocument_Id(UUID documentId);
}
