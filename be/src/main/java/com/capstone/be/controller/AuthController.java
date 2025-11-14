package com.capstone.be.controller;

import com.capstone.be.dto.request.auth.LoginRequest;
import com.capstone.be.dto.request.auth.RegisterReaderRequest;
import com.capstone.be.dto.response.auth.AuthResponse;
import com.capstone.be.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

  private final AuthService authService;

  @PostMapping("/register/reader")
  public ResponseEntity<AuthResponse> registerReader(
      @Valid @RequestBody RegisterReaderRequest request) {
    log.info("Register reader request for email: {}", request.getEmail());
    AuthResponse response = authService.registerReader(request);
    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  @PostMapping("/login")
  public ResponseEntity<AuthResponse> login(
      @Valid @RequestBody LoginRequest request) {
    log.info("Login request for email: {}", request.getEmail());
    AuthResponse response = authService.login(request);
    return ResponseEntity.ok(response);
  }
}
