package com.capstone.be.repository;

import com.capstone.be.domain.entity.CoinTransaction;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface CoinTransactionRepository extends JpaRepository<CoinTransaction, UUID> {

  @Query("SELECT COUNT(ct) FROM CoinTransaction ct WHERE ct.document.id = :documentId")
  Long countByDocumentId(@Param("documentId") UUID documentId);
}

