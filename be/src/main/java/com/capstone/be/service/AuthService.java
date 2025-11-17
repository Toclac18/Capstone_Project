package com.capstone.be.service;

import com.capstone.be.dto.request.auth.LoginRequest;
import com.capstone.be.dto.request.auth.RegisterOrganizationRequest;
import com.capstone.be.dto.request.auth.RegisterReaderRequest;
import com.capstone.be.dto.request.auth.RegisterReviewerRequest;
import com.capstone.be.dto.response.auth.AuthResponse;
import java.util.List;
import org.springframework.web.multipart.MultipartFile;

public interface AuthService {

  /**
   * Register a new reader account
   * Status will be PENDING_EMAIL_VERIFY until email is verified
   *
   * @param request Registration request
   * @return Auth response with user info (no token until email verified)
   */
  AuthResponse registerReader(RegisterReaderRequest request);

  /**
   * Register a new reviewer account Status will be PENDING_EMAIL_VERIFY -> PENDING_APPROVE ->
   * ACTIVE
   *
   * @param request         Registration request
   * @param credentialFiles List of credential files (max 10 files)
   * @return Auth response with user info (no token until email verified)
   */
  AuthResponse registerReviewer(RegisterReviewerRequest request,
      List<MultipartFile> credentialFiles);

  /**
   * Verify email using token sent to user's email
   *
   * @param token Verification token
   * @return Auth response with access token (or pending approve status for reviewers)
   */
  AuthResponse verifyEmail(String token);

  /**
   * Register a new organization account Status will be PENDING_EMAIL_VERIFY -> PENDING_APPROVE ->
   * ACTIVE
   *
   * @param request Registration request
   * @param logoFile Optional logo file
   * @return Auth response with user info (no token until email verified)
   */
  AuthResponse registerOrganization(RegisterOrganizationRequest request, MultipartFile logoFile);

  /**
   * Login with email and password
   * Only works for verified accounts
   *
   * @param request Login request
   * @return Auth response with access token
   */
  AuthResponse login(LoginRequest request);

  /**
   * Resend email verification when the old code has expired
   *
   * @param email User's email address
   */
  void resendVerificationEmail(String email);
}
