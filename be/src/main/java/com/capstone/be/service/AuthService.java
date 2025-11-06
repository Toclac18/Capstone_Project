package com.capstone.be.service;

import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.dto.request.auth.ChangePasswordRequest;
import com.capstone.be.dto.request.auth.LoginRequest;
import com.capstone.be.dto.response.auth.LoginResponse;

import java.util.UUID;

public interface AuthService {

    LoginResponse login(LoginRequest request);

    void changePassword(UUID subjectId, UserRole role, ChangePasswordRequest request);
}
