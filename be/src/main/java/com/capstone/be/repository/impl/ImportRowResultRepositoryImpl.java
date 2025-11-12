package com.capstone.be.repository.impl;

import com.capstone.be.domain.entity.ImportRowResult;
import com.capstone.be.repository.ImportRowResultRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Repository;

@Repository
@Transactional
public class ImportRowResultRepositoryImpl implements ImportRowResultRepository {

  @PersistenceContext
  private EntityManager em;

  @Override
  public ImportRowResult save(ImportRowResult row) {
    if (row.getId() == null) {
      em.persist(row);
      return row;
    } else {
      return em.merge(row);
    }
  }
}