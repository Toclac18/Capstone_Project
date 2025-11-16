package com.capstone.be.controller;

import com.capstone.be.dto.request.user.ChangePasswordRequest;
import com.capstone.be.service.UserService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for user-related operations (profile, password management, etc.)
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/user")
@RequiredArgsConstructor
public class UserController {

  private final UserService userService;

  /**
   * Change password for the authenticated user
   * PUT /api/v1/user/change-password
   *
   * @param authentication Spring Security authentication
   * @param request        Change password request
   * @return 204 No Content on success
   */
  @PutMapping("/change-password")
  public ResponseEntity<Void> changePassword(
      Authentication authentication,
      @Valid @RequestBody ChangePasswordRequest request) {

    UUID userId = UUID.fromString(authentication.getName());
    log.info("Change password request for user: {}", userId);

    userService.changePassword(userId, request);

    return ResponseEntity.noContent().build();
  }

  /**
   * Delete account for the authenticated user (soft delete)
   * DELETE /api/v1/user/account
   *
   * @param authentication Spring Security authentication
   * @return 204 No Content on success
   */
  @DeleteMapping("/account")
  public ResponseEntity<Void> deleteAccount(Authentication authentication) {
    UUID userId = UUID.fromString(authentication.getName());
    log.info("Delete account request for user: {}", userId);

    userService.deleteAccount(userId);

    return ResponseEntity.noContent().build();
  }
}
