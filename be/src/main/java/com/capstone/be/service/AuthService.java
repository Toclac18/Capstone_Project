package com.capstone.be.service;

import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.dto.request.auth.ChangePasswordRequest;
import com.capstone.be.dto.request.auth.LoginRequest;
import com.capstone.be.dto.request.auth.RegisterReaderRequest;
import com.capstone.be.dto.request.auth.RegisterReviewerRequest;
import com.capstone.be.dto.request.auth.VerifyEmailRequest;
import com.capstone.be.dto.response.auth.LoginResponse;
import com.capstone.be.dto.response.auth.RegisterReaderResponse;
import com.capstone.be.dto.response.auth.RegisterReviewerResponse;
import java.util.UUID;

public interface AuthService {

  RegisterReaderResponse registerReader(RegisterReaderRequest request);

  RegisterReviewerResponse registerReviewer(RegisterReviewerRequest request);

  void verifyEmail(VerifyEmailRequest request);

  LoginResponse login(LoginRequest request);

  void changePassword(UUID subjectId, UserRole role, ChangePasswordRequest request);
}
