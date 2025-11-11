package com.capstone.be.repository;

import com.capstone.be.domain.entity.Invitation;

import java.util.Optional;

public interface InvitationRepository {
    Invitation save(Invitation invitation);

    Optional<Invitation> findByToken(String token);
}