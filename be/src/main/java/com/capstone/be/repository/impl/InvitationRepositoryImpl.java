package com.capstone.be.repository.impl;

import com.capstone.be.domain.entity.Invitation;
import com.capstone.be.repository.InvitationRepository;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
@Transactional
public class InvitationRepositoryImpl implements InvitationRepository {

    @PersistenceContext
    private EntityManager em;

    @Override
    public Invitation save(Invitation invitation) {
        if (invitation.getId() == null) {
            em.persist(invitation);
            return invitation;
        } else {
            return em.merge(invitation);
        }
    }

    @Override
    public Optional<Invitation> findByToken(String token) {
        var list = em.createQuery(
                        "SELECT i FROM Invitation i WHERE i.token = :t", Invitation.class)
                .setParameter("t", token)
                .setMaxResults(1)
                .getResultList();
        return list.isEmpty() ? Optional.empty() : Optional.of(list.get(0));
    }
}