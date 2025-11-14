package com.capstone.be.service;

import com.capstone.be.dto.request.auth.LoginRequest;
import com.capstone.be.dto.request.auth.RegisterReaderRequest;
import com.capstone.be.dto.response.auth.AuthResponse;

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
   * Verify email using token sent to user's email
   *
   * @param token Verification token
   * @return Auth response with access token
   */
  AuthResponse verifyEmail(String token);

  /**
   * Login with email and password
   * Only works for verified accounts
   *
   * @param request Login request
   * @return Auth response with access token
   */
  AuthResponse login(LoginRequest request);
}
