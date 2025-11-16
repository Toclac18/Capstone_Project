package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.UserStatus;
import com.capstone.be.dto.request.user.ChangePasswordRequest;
import com.capstone.be.exception.BusinessException;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.service.UserService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;

  @Override
  @Transactional
  public void changePassword(UUID userId, ChangePasswordRequest request) {
    // Validate password confirmation
    if (!request.getNewPassword().equals(request.getConfirmPassword())) {
      throw new BusinessException(
          "New password and confirmation password do not match",
          HttpStatus.BAD_REQUEST,
          "PASSWORD_MISMATCH"
      );
    }

    // Find user
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new BusinessException(
            "User not found with id: " + userId,
            HttpStatus.NOT_FOUND,
            "USER_NOT_FOUND"
        ));

    // Verify current password
    if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
      throw new BusinessException(
          "Current password is incorrect",
          HttpStatus.BAD_REQUEST,
          "INVALID_CURRENT_PASSWORD"
      );
    }

    // Check if new password is same as current password
    if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
      throw new BusinessException(
          "New password must be different from current password",
          HttpStatus.BAD_REQUEST,
          "SAME_PASSWORD"
      );
    }

    // Update password
    user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
    userRepository.save(user);

    log.info("Password changed successfully for user: {}", userId);
  }

  @Override
  @Transactional
  public void deleteAccount(UUID userId) {
    log.info("Deleting account for user ID: {}", userId);

    // Find user
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new BusinessException(
            "User not found with id: " + userId,
            HttpStatus.NOT_FOUND,
            "USER_NOT_FOUND"
        ));

    // Check if already deleted
    if (user.getStatus() == UserStatus.DELETED) {
      throw new BusinessException(
          "Account is already deleted",
          HttpStatus.BAD_REQUEST,
          "ACCOUNT_ALREADY_DELETED"
      );
    }

    // Soft delete - set status to DELETED
    user.setStatus(UserStatus.DELETED);
    userRepository.save(user);

    log.info("Account deleted successfully for user: {}", userId);
  }
}
