package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.ReaderProfile;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.domain.enums.UserStatus;
import com.capstone.be.dto.request.auth.LoginRequest;
import com.capstone.be.dto.request.auth.RegisterReaderRequest;
import com.capstone.be.dto.response.auth.AuthResponse;
import com.capstone.be.repository.ReaderProfileRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.security.jwt.JwtUtil;
import com.capstone.be.service.AuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

  private final UserRepository userRepository;
  private final ReaderProfileRepository readerProfileRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtUtil jwtUtil;
  private final AuthenticationManager authenticationManager;

  @Override
  @Transactional
  public AuthResponse registerReader(RegisterReaderRequest request) {
    // Check if email already exists
    if (userRepository.existsByEmail(request.getEmail())) {
      throw new IllegalArgumentException("Email already exists");
    }

    // Create User entity
    User user = User.builder()
        .email(request.getEmail())
        .passwordHash(passwordEncoder.encode(request.getPassword()))
        .fullName(request.getFullName())
        .role(UserRole.READER)
        .status(UserStatus.ACTIVE) // Can be PENDING_EMAIL_VERIFY if email verification is required
        .point(0)
        .build();

    user = userRepository.save(user);
    log.info("Created user with id: {}", user.getId());

    // Create ReaderProfile
    ReaderProfile readerProfile = ReaderProfile.builder()
        .user(user)
        .dob(request.getDateOfBirth())
        .build();

    readerProfileRepository.save(readerProfile);
    log.info("Created reader profile for user id: {}", user.getId());

    // Generate JWT token
    String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());

    return AuthResponse.builder()
        .userId(user.getId())
        .email(user.getEmail())
        .fullName(user.getFullName())
        .role(user.getRole())
        .status(user.getStatus())
        .accessToken(token)
        .tokenType("Bearer")
        .build();
  }

  @Override
  @Transactional(readOnly = true)
  public AuthResponse login(LoginRequest request) {
    // Authenticate user
    Authentication authentication = authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(
            request.getEmail(),
            request.getPassword()
        )
    );

    // Get user from database
    User user = userRepository.findByEmail(request.getEmail())
        .orElseThrow(() -> new IllegalArgumentException("User not found"));

    // Generate JWT token
    String token = jwtUtil.generateToken(user.getId(), user.getEmail(), user.getRole().name());

    return AuthResponse.builder()
        .userId(user.getId())
        .email(user.getEmail())
        .fullName(user.getFullName())
        .role(user.getRole())
        .status(user.getStatus())
        .accessToken(token)
        .tokenType("Bearer")
        .build();
  }
}
