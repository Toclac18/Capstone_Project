package com.capstone.be.service;

import com.capstone.be.dto.request.LoginRequest;
import com.capstone.be.dto.response.LoginResponse;

public interface AuthService {

  LoginResponse login(LoginRequest request);
}
