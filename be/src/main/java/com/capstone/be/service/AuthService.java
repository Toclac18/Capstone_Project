package com.capstone.be.service;

import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.dto.request.auth.ChangePasswordRequest;
import com.capstone.be.dto.request.auth.LoginRequest;
import com.capstone.be.dto.response.auth.LoginResponse;

public interface AuthService {

  LoginResponse login(LoginRequest request);

  void changePassword(Long subjectId, UserRole role, ChangePasswordRequest request);
}
