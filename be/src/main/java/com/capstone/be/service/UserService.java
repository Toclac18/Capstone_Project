package com.capstone.be.service;

import com.capstone.be.dto.request.user.ChangePasswordRequest;
import java.util.UUID;

/**
 * Service for user-related operations
 */
public interface UserService {

  /**
   * Change user password
   *
   * @param userId  User ID
   * @param request Change password request
   */
  void changePassword(UUID userId, ChangePasswordRequest request);

  /**
   * Delete user account (soft delete - set status to DELETED)
   *
   * @param userId User ID
   */
  void deleteAccount(UUID userId);
}
