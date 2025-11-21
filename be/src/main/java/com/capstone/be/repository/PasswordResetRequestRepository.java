package com.capstone.be.repository;

import com.capstone.be.domain.entity.PasswordResetRequest;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.PasswordResetStatus;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PasswordResetRequestRepository extends JpaRepository<PasswordResetRequest, UUID> {

  /**
   * Find pending password reset request for a user
   */
  Optional<PasswordResetRequest> findByUserAndStatus(User user, PasswordResetStatus status);

  /**
   * Find pending password reset request by email
   */
  Optional<PasswordResetRequest> findByEmailAndStatus(String email, PasswordResetStatus status);

  /**
   * Delete all password reset requests for a user
   */
  void deleteByUser(User user);
}
