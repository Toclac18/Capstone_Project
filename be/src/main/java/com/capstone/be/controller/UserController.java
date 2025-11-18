package com.capstone.be.controller;

import com.capstone.be.dto.request.user.ChangeEmailRequest;
import com.capstone.be.dto.request.user.ChangePasswordRequest;
import com.capstone.be.dto.request.user.VerifyEmailChangeOtpRequest;
import com.capstone.be.security.model.UserPrincipal;
import com.capstone.be.service.UserService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
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
   * @param request        Change password request
   * @return 204 No Content on success
   */
  @PutMapping("/change-password")
  public ResponseEntity<Void> changePassword(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @Valid @RequestBody ChangePasswordRequest request) {

    UUID userId = userPrincipal.getId();
    log.info("Change password request for user: {}", userId);

    userService.changePassword(userId, request);

    return ResponseEntity.noContent().build();
  }

  /**
   * Delete account for the authenticated user (soft delete)
   * DELETE /api/v1/user/account
   *
   * @return 204 No Content on success
   */
  @DeleteMapping("/account")
  public ResponseEntity<Void> deleteAccount(
      @AuthenticationPrincipal UserPrincipal userPrincipal) {
    UUID userId = userPrincipal.getId();
    log.info("Delete account request for user: {}", userId);

    userService.deleteAccount(userId);

    return ResponseEntity.noContent().build();
  }

  /**
   * Request email change - sends OTP to current email
   * POST /api/v1/user/change-email
   *
   * @param request        Change email request (new email)
   * @return 200 OK with message
   */
  @PostMapping("/change-email")
  public ResponseEntity<String> requestEmailChange(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @Valid @RequestBody ChangeEmailRequest request) {
    UUID userId = userPrincipal.getId();
    log.info("Request email change for user: {} to new email: {}", userId, request.getNewEmail());

    userService.requestEmailChange(userId, request);

    return ResponseEntity.ok("OTP has been sent to your current email address");
  }

  /**
   * Verify OTP and change email
   * POST /api/v1/user/verify-email-change
   *
   * @param request        Verify OTP request
   * @return 200 OK with message
   */
  @PostMapping("/verify-email-change")
  public ResponseEntity<String> verifyEmailChangeOtp(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @Valid @RequestBody VerifyEmailChangeOtpRequest request) {
    UUID userId = userPrincipal.getId();
    log.info("Verify email change OTP for user: {}", userId);

    userService.verifyEmailChangeOtp(userId, request.getOtp());

    return ResponseEntity.ok("Email changed successfully. Please login again with your new email");
  }
}
