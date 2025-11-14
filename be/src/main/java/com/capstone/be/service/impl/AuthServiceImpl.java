package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.ReaderProfile;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.domain.enums.UserStatus;
import com.capstone.be.dto.request.auth.LoginRequest;
import com.capstone.be.dto.request.auth.RegisterReaderRequest;
import com.capstone.be.dto.response.auth.AuthResponse;
import com.capstone.be.exception.DuplicateResourceException;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.exception.UnauthorizedException;
import com.capstone.be.repository.ReaderProfileRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.security.jwt.JwtUtil;
import com.capstone.be.service.AuthService;
import com.capstone.be.service.EmailService;
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
  private final EmailService emailService;

  @Override
  @Transactional
  public AuthResponse registerReader(RegisterReaderRequest request) {
    // Check if email already exists
    if (userRepository.existsByEmail(request.getEmail())) {
      throw DuplicateResourceException.email(request.getEmail());
    }

    // Create User entity with PENDING_EMAIL_VERIFY status
    User user = User.builder()
        .email(request.getEmail())
        .passwordHash(passwordEncoder.encode(request.getPassword()))
        .fullName(request.getFullName())
        .role(UserRole.READER)
        .status(UserStatus.PENDING_EMAIL_VERIFY)
        .point(0)
        .build();

    user = userRepository.save(user);
    log.info("Created user with id: {} - pending email verification", user.getId());

    // Create ReaderProfile
    ReaderProfile readerProfile = ReaderProfile.builder()
        .user(user)
        .dob(request.getDateOfBirth())
        .build();

    readerProfileRepository.save(readerProfile);
    log.info("Created reader profile for user id: {}", user.getId());

    // Generate email verification token (expires in 10 minutes)
    String verificationToken = jwtUtil.generateEmailVerificationToken(
        user.getId(),
        user.getEmail()
    );

    // Send verification email (async)
    emailService.sendEmailVerification(user.getId(), user.getEmail(), verificationToken);

    // Return response WITHOUT access token (user needs to verify email first)
    return AuthResponse.builder()
        .userId(user.getId())
        .email(user.getEmail())
        .fullName(user.getFullName())
        .role(user.getRole())
        .status(user.getStatus())
        .accessToken(null) // No token until email verified
        .tokenType("Bearer")
        .build();
  }

  @Override
  @Transactional
  public AuthResponse verifyEmail(String token) {
    // Validate token
    if (!jwtUtil.validateToken(token)) {
      throw UnauthorizedException.tokenInvalid();
    }

    // Extract user info from token
    String email = jwtUtil.getEmailFromToken(token);

    // Find user
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> ResourceNotFoundException.userByEmail(email));

    // Check if already verified
    if (user.getStatus() == UserStatus.ACTIVE) {
      log.info("User {} already verified, generating new token", email);
    } else if (user.getStatus() != UserStatus.PENDING_EMAIL_VERIFY) {
      throw UnauthorizedException.accountDisabled();
    } else {
      // Update status to ACTIVE
      user.setStatus(UserStatus.ACTIVE);
      userRepository.save(user);
      log.info("User {} email verified successfully", email);

      // Send welcome email (async, non-blocking)
      emailService.sendWelcomeEmail(user.getEmail(), user.getFullName());
    }

    // Generate access token
    String accessToken = jwtUtil.generateToken(
        user.getId(),
        user.getEmail(),
        user.getRole().name()
    );

    return AuthResponse.builder()
        .userId(user.getId())
        .email(user.getEmail())
        .fullName(user.getFullName())
        .role(user.getRole())
        .status(user.getStatus())
        .accessToken(accessToken)
        .tokenType("Bearer")
        .build();
  }

  @Override
  @Transactional(readOnly = true)
  public AuthResponse login(LoginRequest request) {
    // Authenticate user (will throw BadCredentialsException if wrong credentials)
    Authentication authentication = authenticationManager.authenticate(
        new UsernamePasswordAuthenticationToken(
            request.getEmail(),
            request.getPassword()
        )
    );

    // Get user from database
    User user = userRepository.findByEmail(request.getEmail())
        .orElseThrow(() -> ResourceNotFoundException.userByEmail(request.getEmail()));

    // Check if email is verified
    if (user.getStatus() == UserStatus.PENDING_EMAIL_VERIFY) {
      throw UnauthorizedException.emailNotVerified();
    }

    // Check if account is active
    if (user.getStatus() != UserStatus.ACTIVE) {
      throw UnauthorizedException.accountDisabled();
    }

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
