package com.capstone.be.controller;

import com.capstone.be.dto.request.auth.LoginRequest;
import com.capstone.be.dto.request.auth.RegisterOrganizationRequest;
import com.capstone.be.dto.request.auth.RegisterReaderRequest;
import com.capstone.be.dto.request.auth.RegisterReviewerRequest;
import com.capstone.be.dto.request.auth.ResendVerificationEmailRequest;
import com.capstone.be.dto.request.auth.VerifyEmailRequest;
import com.capstone.be.dto.request.user.RequestPasswordResetRequest;
import com.capstone.be.dto.request.user.VerifyPasswordResetOtpRequest;
import com.capstone.be.dto.response.auth.AuthResponse;
import com.capstone.be.service.AuthService;
import com.capstone.be.service.UserService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthService authService;
  private final UserService userService;

  @PostMapping("/register/reader")
  public ResponseEntity<AuthResponse> registerReader(
      @Valid @RequestBody RegisterReaderRequest request) {
    log.info("Register reader request for email: {}", request.getEmail());
    AuthResponse response = authService.registerReader(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @PostMapping(value = "/register/reviewer", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<AuthResponse> registerReviewer(
      @Valid @RequestPart("data") RegisterReviewerRequest request,
      @RequestPart("credentialFiles") List<MultipartFile> credentialFiles) {
    log.info("Register reviewer request for email: {}", request.getEmail());
    AuthResponse response = authService.registerReviewer(request, credentialFiles);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @PostMapping(value = "/register/organization", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  public ResponseEntity<AuthResponse> registerOrganization(
      @Valid @RequestPart("data") RegisterOrganizationRequest request,
      @RequestPart(value = "logoFile", required = false) MultipartFile logoFile) {
    log.info("Register organization request for admin email: {}", request.getAdminEmail());
    AuthResponse response = authService.registerOrganization(request, logoFile);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @PostMapping("/verify-email")
  public ResponseEntity<AuthResponse> verifyEmail(
      @Valid @RequestBody VerifyEmailRequest request) {
    log.info("Email verification request");
    AuthResponse response = authService.verifyEmail(request.getToken());
    return ResponseEntity.ok(response);
  }

  @PostMapping("/login")
  public ResponseEntity<AuthResponse> login(
      @Valid @RequestBody LoginRequest request) {
    log.info("Login request for email: {}", request.getEmail());
    AuthResponse response = authService.login(request);
    return ResponseEntity.ok(response);
  }

  @PostMapping("/resend-verification-email")
  public ResponseEntity<Void> resendVerificationEmail(
      @Valid @RequestBody ResendVerificationEmailRequest request) {
    log.info("Resend verification email request for: {}", request.getEmail());
    authService.resendVerificationEmail(request.getEmail());
    return ResponseEntity.ok().build();
  }

  /**
   * Request password reset - sends OTP to user's email
   * POST /api/v1/auth/request-password-reset
   *
   * @param request Request password reset request (email)
   * @return 200 OK with message
   */
  @PostMapping("/request-password-reset")
  public ResponseEntity<String> requestPasswordReset(
      @Valid @RequestBody RequestPasswordResetRequest request) {
    log.info("Request password reset for email: {}", request.getEmail());
    userService.requestPasswordReset(request.getEmail());
    return ResponseEntity.ok("OTP has been sent to your email address");
  }

  /**
   * Verify OTP and reset password
   * POST /api/v1/auth/reset-password
   *
   * @param request Verify password reset OTP request (email, otp, newPassword)
   * @return 200 OK with message
   */
  @PostMapping("/reset-password")
  public ResponseEntity<String> resetPassword(
      @Valid @RequestBody VerifyPasswordResetOtpRequest request) {
    log.info("Reset password for email: {}", request.getEmail());
    userService.verifyPasswordResetOtp(request.getEmail(), request.getOtp(), request.getNewPassword());
    return ResponseEntity.ok("Password reset successfully. You can now login with your new password");
  }
}
