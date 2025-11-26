package com.capstone.be.repository;

import com.capstone.be.domain.entity.PasswordResetToken;
import com.capstone.be.domain.entity.User;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

  /**
   * Find valid (unused and not expired) token by token hash
   */
  @Query("SELECT t FROM PasswordResetToken t WHERE t.tokenHash = :tokenHash AND t.used = false AND t.expiryTime > :now")
  Optional<PasswordResetToken> findValidTokenByHash(@Param("tokenHash") String tokenHash, @Param("now")Instant now);

  /**
   * Invalidate all existing tokens for a user
   */
  @Modifying
  @Query("UPDATE PasswordResetToken t SET t.used = true WHERE t.user = :user AND t.used = false")
  void invalidateAllUserTokens(@Param("user") User user);

  /**
   * Delete expired tokens (cleanup job)
   */
  @Modifying
  @Query("DELETE FROM PasswordResetToken t WHERE t.expiryTime < :cutoffTime")
  int deleteExpiredTokens(@Param("cutoffTime") Instant cutoffTime);
}
