package com.capstone.be.repository;

import com.capstone.be.domain.entity.DocumentRedemption;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DocumentRedemptionRepository extends JpaRepository<DocumentRedemption, UUID> {

  Optional<DocumentRedemption> findByReader_IdAndDocument_Id(UUID readerId, UUID documentId);
  boolean existsByReader_IdAndDocument_Id(UUID readerId, UUID documentId);
  List<DocumentRedemption> findByReader_Id(UUID readerId);

  List<DocumentRedemption> findByDocument_Id(UUID documentId);

  long countByDocument_Id(UUID documentId);

}
