package com.capstone.be.repository;

import com.capstone.be.domain.entity.EmailChangeRequest;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.EmailChangeStatus;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface EmailChangeRequestRepository extends JpaRepository<EmailChangeRequest, UUID> {

  /**
   * Find pending email change request for a user
   */
  Optional<EmailChangeRequest> findByUserAndStatus(User user, EmailChangeStatus status);

  /**
   * Find pending email change request by new email
   */
  Optional<EmailChangeRequest> findByNewEmailAndStatus(String newEmail, EmailChangeStatus status);

  /**
   * Delete all email change requests for a user
   */
  void deleteByUser(User user);
}
