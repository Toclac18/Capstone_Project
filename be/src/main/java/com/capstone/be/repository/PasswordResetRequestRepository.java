package com.capstone.be.repository;

import com.capstone.be.domain.entity.PasswordResetRequest;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.PasswordResetStatus;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

  /**
   * Count recent OTP requests by email within time window (for rate limiting)
   */
  @Query("SELECT COUNT(r) FROM PasswordResetRequest r WHERE r.email = :email AND r.createdAt > :since")
  long countRecentRequestsByEmail(@Param("email") String email, @Param("since") Instant since);
}
