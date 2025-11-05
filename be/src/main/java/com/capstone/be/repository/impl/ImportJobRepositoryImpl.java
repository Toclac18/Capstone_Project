package com.capstone.be.repository.impl;

import com.capstone.be.domain.entity.ImportJob;
import com.capstone.be.repository.ImportJobRepository;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.stereotype.Repository;

@Repository
public class ImportJobRepositoryImpl implements ImportJobRepository {
  private final Map<String, ImportJob> store = new ConcurrentHashMap<>();

  @Override
  public ImportJob save(ImportJob job) {
    store.put(job.getId(), job);
    return job;
  }

  @Override
  public Optional<ImportJob> findById(String id) {
    return Optional.ofNullable(store.get(id));
  }

  @Override
  public java.util.List<ImportJob> findAll() {
    return new java.util.ArrayList<>(store.values());
  }

  @Override
  public void deleteAll() {
    store.clear();
  }
}
