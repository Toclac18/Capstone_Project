package com.capstone.be.repository.impl;

import com.capstone.be.domain.entity.ImportJob;
import com.capstone.be.repository.ImportJobRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
@Transactional
public class ImportJobRepositoryImpl implements ImportJobRepository {

    @PersistenceContext
    private EntityManager em;

    @Override
    public ImportJob save(ImportJob job) {
        if (em.find(ImportJob.class, job.getId()) == null) {
            em.persist(job);
            return job;
        } else {
            return em.merge(job);
        }
    }

    @Override
    public Optional<ImportJob> findById(String id) {
        return Optional.ofNullable(em.find(ImportJob.class, id));
    }

    @Override
    public List<ImportJob> findAll() {
        return em.createQuery(
                "SELECT j FROM ImportJob j ORDER BY j.createdAt DESC", ImportJob.class).getResultList();
    }

    @Override
    public Optional<ImportJob> findByIdWithResults(String id) {
        var list = em.createQuery(
                        "SELECT j FROM ImportJob j LEFT JOIN FETCH j.results WHERE j.id = :id",
                        ImportJob.class)
                .setParameter("id", id)
                .getResultList();
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }

    @Override
    public void deleteAll() {
        em.createQuery("DELETE FROM ImportRowResult").executeUpdate();
        em.createQuery("DELETE FROM ImportJob").executeUpdate();
    }
}
