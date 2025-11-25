package com.capstone.be.repository;

import com.capstone.be.domain.entity.SavedListDocument;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SavedListDocumentRepository extends JpaRepository<SavedListDocument, UUID> {

  Optional<SavedListDocument> findBySavedListIdAndDocumentId(UUID savedListId, UUID documentId);

  boolean existsBySavedListIdAndDocumentId(UUID savedListId, UUID documentId);
}
