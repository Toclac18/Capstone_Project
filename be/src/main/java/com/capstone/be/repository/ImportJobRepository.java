package com.capstone.be.repository;

import com.capstone.be.domain.entity.ImportJob;
import java.util.*;

public interface ImportJobRepository {
  ImportJob save(ImportJob job);

  Optional<ImportJob> findById(String id);

  java.util.List<ImportJob> findAll();

  void deleteAll();
}
