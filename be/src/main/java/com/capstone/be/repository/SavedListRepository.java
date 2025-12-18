package com.capstone.be.repository;

import com.capstone.be.domain.entity.SavedList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SavedListRepository extends JpaRepository<SavedList, UUID> {

  List<SavedList> findByReaderId(UUID readerId);

  Optional<SavedList> findByIdAndReaderId(UUID id, UUID readerId);

  @Query("SELECT sl FROM SavedList sl LEFT JOIN FETCH sl.savedListDocuments WHERE sl.reader.id = :readerId")
  List<SavedList> findByReaderIdWithDocuments(@Param("readerId") UUID readerId);

  // Check if a SavedList with the same name exists for a reader
  boolean existsByReaderIdAndName(UUID readerId, String name);

  // Check if a SavedList with the same name exists for a reader (excluding current list)
  boolean existsByReaderIdAndNameAndIdNot(UUID readerId, String name, UUID id);
}
