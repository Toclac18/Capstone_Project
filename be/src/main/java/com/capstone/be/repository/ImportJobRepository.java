package com.capstone.be.repository;

import com.capstone.be.domain.entity.ImportJob;
import java.util.List;
import java.util.Optional;

public interface ImportJobRepository {

  ImportJob save(ImportJob job);

  Optional<ImportJob> findById(String id);

  List<ImportJob> findAll();

  Optional<ImportJob> findByIdWithResults(String id);

  void deleteAll();
}