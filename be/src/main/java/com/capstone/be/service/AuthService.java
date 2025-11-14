package com.capstone.be.service;

import com.capstone.be.dto.request.auth.LoginRequest;
import com.capstone.be.dto.request.auth.RegisterReaderRequest;
import com.capstone.be.dto.response.auth.AuthResponse;

public interface AuthService {

  AuthResponse registerReader(RegisterReaderRequest request);

  AuthResponse login(LoginRequest request);
}
