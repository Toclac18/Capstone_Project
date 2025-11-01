package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.BusinessAdmin;
import com.capstone.be.domain.entity.Organization;
import com.capstone.be.domain.entity.Reader;
import com.capstone.be.domain.entity.Reviewer;
import com.capstone.be.domain.entity.SystemAdmin;
import com.capstone.be.domain.enums.OrganizationStatus;
import com.capstone.be.domain.enums.ReaderStatus;
import com.capstone.be.domain.enums.ReviewerStatus;
import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.dto.request.auth.ChangePasswordRequest;
import com.capstone.be.dto.request.auth.LoginRequest;
import com.capstone.be.dto.request.auth.RegisterReaderRequest;
import com.capstone.be.dto.request.auth.RegisterReviewerRequest;
import com.capstone.be.dto.request.auth.VerifyEmailRequest;
import com.capstone.be.dto.response.auth.LoginResponse;
import com.capstone.be.dto.response.auth.RegisterReaderResponse;
import com.capstone.be.dto.response.auth.RegisterReviewerResponse;
import com.capstone.be.mapper.ReaderMapper;
import com.capstone.be.repository.BusinessAdminRepository;
import com.capstone.be.repository.OrganizationRepository;
import com.capstone.be.repository.ReaderRepository;
import com.capstone.be.repository.ReviewerRepository;
import com.capstone.be.repository.SystemAdminRepository;
import com.capstone.be.security.service.JwtService;
import com.capstone.be.security.util.JwtUtil;
import com.capstone.be.service.AuthService;
import com.capstone.be.service.EmailService;
import com.capstone.be.util.ExceptionBuilder;
import io.jsonwebtoken.JwtException;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Consumer;
import java.util.function.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

  private final ReaderRepository readerRepository;
  private final ReviewerRepository reviewerRepository;
  private final OrganizationRepository organizationRepository;
  private final BusinessAdminRepository businessAdminRepository;
  private final SystemAdminRepository systemAdminRepository;

  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;
  private final JwtUtil jwtUtil;
  private final ReaderMapper readerMapper;
  private final EmailService emailService;

  @Override
  @Transactional
  public RegisterReaderResponse registerReader(RegisterReaderRequest request) {
    // Check email existed
    if (readerRepository.existsByEmail(request.getEmail())) {
      throw new IllegalArgumentException("Email has been used");
    }

    // Check username existed
    if (readerRepository.existsByUsername(request.getUsername())) {
      throw new IllegalArgumentException("Username has been used");
    }

    // Create Reader Entity From Dto
    Reader reader = readerMapper.toReader(request);
    reader.setPasswordHash(passwordEncoder.encode(request.getPassword()));

    // Save Reader to DB
    Reader savedReader = readerRepository.save(reader);

    //Send Verification email
    String verificationToken = jwtService.generateEmailVerifyToken(UserRole.READER,
        savedReader.getEmail());
    System.out.println("Verify Token for " + savedReader.getEmail() + " : " + verificationToken);
    emailService.sendReaderVerificationEmail(savedReader, verificationToken);

    return readerMapper.toRegisterResponse(savedReader);
  }

  @Override
  public RegisterReviewerResponse registerReviewer(RegisterReviewerRequest request) {
    return null;
  }

  @Override
  @Transactional
  public void verifyEmail(VerifyEmailRequest request) {
    String token = request.getToken();
    UserRole role;
    String email;
    try {
      role = jwtService.extractRoleFromToken(token);
      email = jwtService.extractEmailFromToken(token);
    } catch (JwtException | IllegalArgumentException ex) {
      throw ExceptionBuilder.badRequest("Verify token is invalid or expired");
    }

    findAndVerifyEmail(role, email);
  }

  private void findAndVerifyEmail(UserRole role, String email) {
    switch (role) {
      case READER -> activate(readerRepository.findByEmail(email),
          r -> ReaderStatus.PENDING_VERIFICATION.equals(r.getStatus()),
          r -> r.setStatus(ReaderStatus.ACTIVE));

      case REVIEWER -> activate(reviewerRepository.findByEmail(email),
          r -> ReviewerStatus.PENDING_VERIFICATION.equals(r.getStatus()),
          r -> r.setStatus(ReviewerStatus.ACTIVE));

      case ORGANIZATION -> activate(organizationRepository.findByEmail(email),
          o -> OrganizationStatus.PENDING_VERIFICATION.equals(o.getStatus()),
          o -> o.setStatus(OrganizationStatus.ACTIVE));

      default -> throw ExceptionBuilder.badRequest("Invalid role: " + role);
    }
  }

  private <T> void activate(Optional<T> opt, Predicate<T> isPending, Consumer<T> activate) {
    T entity = opt.orElseThrow(() -> ExceptionBuilder.notFound("Account not found"));
    if (isPending.test(entity)) {
      activate.accept(entity);
    }
  }

  @Override
  @Transactional(readOnly = true)
  public LoginResponse login(LoginRequest request) {
    UserRole role = request.getRole();
    String email = request.getEmail();

    return switch (role) {
      case READER -> authenticateReader(email, request.getPassword());
      case REVIEWER -> authenticateReviewer(email, request.getPassword());
      case ORGANIZATION -> authenticateOrganization(email, request.getPassword());
      case BUSINESS_ADMIN -> authenticateBusinessAdmin(email, request.getPassword());
      case SYSTEM_ADMIN -> authenticateSystemAdmin(email, request.getPassword());
    };
  }

  private LoginResponse authenticateReader(String email, String rawPassword) {
    Reader reader = readerRepository.findByEmail(email)
        .orElseThrow(() -> ExceptionBuilder.unauthorized("Invalid email or password"));

    verifyPassword(rawPassword, reader.getPasswordHash());

    if (!ReaderStatus.ACTIVE.equals(reader.getStatus())) {
      throw ExceptionBuilder.unauthorized("Account is disable or not verified");

    }

    String token = jwtService.generateToken(reader.getId(), UserRole.READER,
        reader.getEmail());

    return baseResponse(token, reader.getId(), UserRole.READER, reader.getEmail(),
        reader.getUsername());
  }

  private LoginResponse authenticateReviewer(String email, String rawPassword) {
    Reviewer reviewer = reviewerRepository.findByEmail(email)
        .orElseThrow(() -> ExceptionBuilder.unauthorized("Invalid email or password"));

    verifyPassword(rawPassword, reviewer.getPasswordHash());

    if (!Boolean.TRUE.equals(reviewer.getActive())
        || Boolean.TRUE.equals(reviewer.getDeleted())) {
      throw ExceptionBuilder.unauthorized("Account is disabled");
    }

    String token = jwtService.generateToken(reviewer.getId(), UserRole.REVIEWER,
        reviewer.getEmail());

    return baseResponse(token, reviewer.getId(), UserRole.REVIEWER, reviewer.getEmail(),
        reviewer.getFullName());
  }

  private LoginResponse authenticateOrganization(String adminEmail, String rawPassword) {
    Organization organization = organizationRepository.findByAdminEmail(adminEmail)
        .orElseThrow(() -> ExceptionBuilder.unauthorized("Invalid email or password"));

    verifyPassword(rawPassword, organization.getAdminPassword());

    if (!Boolean.TRUE.equals(organization.getActive()) || Boolean.TRUE.equals(
        organization.getDeleted())) {
      throw ExceptionBuilder.unauthorized("Account is disabled");
    }

    String token = jwtService.generateToken(organization.getId(), UserRole.ORGANIZATION,
        organization.getAdminEmail());

    return baseResponse(token, organization.getId(), UserRole.ORGANIZATION,
        organization.getAdminEmail(), organization.getAdminName());
  }

  private LoginResponse authenticateBusinessAdmin(String email, String rawPassword) {
    BusinessAdmin admin = businessAdminRepository.findByEmail(email)
        .orElseThrow(() -> ExceptionBuilder.unauthorized("Invalid email or password"));

    verifyPassword(rawPassword, admin.getPasswordHash());

    if (!Boolean.TRUE.equals(admin.getActive()) || Boolean.TRUE.equals(admin.getDeleted())) {
      throw ExceptionBuilder.unauthorized("Account is disabled");
    }

    String token = jwtService.generateToken(admin.getId(), UserRole.BUSINESS_ADMIN,
        admin.getEmail());

    return baseResponse(token, admin.getId(), UserRole.BUSINESS_ADMIN, admin.getEmail(),
        admin.getFullName());
  }

  private LoginResponse authenticateSystemAdmin(String email, String rawPassword) {
    SystemAdmin admin = systemAdminRepository.findByEmail(email)
        .orElseThrow(() -> ExceptionBuilder.unauthorized("Invalid email or password"));

    verifyPassword(rawPassword, admin.getPasswordHash());

    if (!Boolean.TRUE.equals(admin.getActive()) || Boolean.TRUE.equals(admin.getDeleted())) {
      throw ExceptionBuilder.unauthorized("Account is disabled");
    }

    String token = jwtService.generateToken(admin.getId(), UserRole.SYSTEM_ADMIN, admin.getEmail());

    return baseResponse(token, admin.getId(), UserRole.SYSTEM_ADMIN, admin.getEmail(),
        admin.getFullName());
  }

  private void verifyPassword(String rawPassword, String passwordHash) {
    if (!passwordEncoder.matches(rawPassword, Optional.ofNullable(passwordHash).orElse(""))) {
      throw ExceptionBuilder.unauthorized("Invalid email or password");
    }
  }

  private LoginResponse baseResponse(String token, UUID id, UserRole role, String email,
      String displayName) {
    return LoginResponse.builder()
        .accessToken(token)
        .tokenType("Bearer")
        .expiresIn(jwtService.getExpirationMs())
        .subjectId(id.toString())
        .role(role)
        .email(email)
        .displayName(displayName)
        .build();
  }

  @Override
  @Transactional
  public void changePassword(UUID subjectId, UserRole role, ChangePasswordRequest request) {
    if (subjectId == null || role == null) {
      throw ExceptionBuilder.badRequest("Subject information is required");
    }

    if (request.getNewPassword().equals(request.getCurrentPassword())) {
      throw ExceptionBuilder.badRequest("New password must be different from current password");
    }

    switch (role) {
      case READER -> changeReaderPassword(subjectId, request);
      case REVIEWER -> changeReviewerPassword(subjectId, request);
      case ORGANIZATION -> changeOrganizationPassword(subjectId, request);
      case BUSINESS_ADMIN -> changeBusinessAdminPassword(subjectId, request);
      case SYSTEM_ADMIN -> changeSystemAdminPassword(subjectId, request);
    }
  }

  private void changeReaderPassword(UUID subjectId, ChangePasswordRequest request) {
    Reader reader = readerRepository.findById(subjectId)
        .orElseThrow(() -> ExceptionBuilder.notFound("Account not found"));

    assertCurrentPasswordMatches(request.getCurrentPassword(), reader.getPasswordHash());

    String encoded = passwordEncoder.encode(request.getNewPassword());
    reader.setPasswordHash(encoded);
    readerRepository.save(reader);
  }

  private void changeReviewerPassword(UUID subjectId, ChangePasswordRequest request) {
    Reviewer reviewer = reviewerRepository.findById(subjectId)
        .orElseThrow(() -> ExceptionBuilder.notFound("Account not found"));

    if (!Boolean.TRUE.equals(reviewer.getActive()) || Boolean.TRUE.equals(reviewer.getDeleted())) {
      throw ExceptionBuilder.forbidden("Account is disabled");
    }

    assertCurrentPasswordMatches(request.getCurrentPassword(), reviewer.getPasswordHash());

    String encoded = passwordEncoder.encode(request.getNewPassword());
    reviewer.setPasswordHash(encoded);
    reviewerRepository.save(reviewer);
  }

  private void changeOrganizationPassword(UUID subjectId, ChangePasswordRequest request) {
    Organization organization = organizationRepository.findById(subjectId)
        .orElseThrow(() -> ExceptionBuilder.notFound("Account not found"));

    if (!Boolean.TRUE.equals(organization.getActive())
        || Boolean.TRUE.equals(organization.getDeleted())) {
      throw ExceptionBuilder.forbidden("Account is disabled");
    }

    assertCurrentPasswordMatches(request.getCurrentPassword(), organization.getAdminPassword());

    String encoded = passwordEncoder.encode(request.getNewPassword());
    organization.setAdminPassword(encoded);
    organizationRepository.save(organization);
  }

  private void changeBusinessAdminPassword(UUID subjectId, ChangePasswordRequest request) {
    BusinessAdmin admin = businessAdminRepository.findById(subjectId)
        .orElseThrow(() -> ExceptionBuilder.notFound("Account not found"));

    if (!Boolean.TRUE.equals(admin.getActive()) || Boolean.TRUE.equals(admin.getDeleted())) {
      throw ExceptionBuilder.unauthorized("Account is disabled");
    }

    assertCurrentPasswordMatches(request.getCurrentPassword(), admin.getPasswordHash());

    String encoded = passwordEncoder.encode(request.getNewPassword());
    admin.setPasswordHash(encoded);
    businessAdminRepository.save(admin);
  }

  private void changeSystemAdminPassword(UUID subjectId, ChangePasswordRequest request) {
    SystemAdmin admin = systemAdminRepository.findById(subjectId)
        .orElseThrow(() -> ExceptionBuilder.notFound("Account not found"));

    if (!Boolean.TRUE.equals(admin.getActive()) || Boolean.TRUE.equals(admin.getDeleted())) {
      throw ExceptionBuilder.unauthorized("Account is disabled");
    }

    assertCurrentPasswordMatches(request.getCurrentPassword(), admin.getPasswordHash());

    String encoded = passwordEncoder.encode(request.getNewPassword());
    admin.setPasswordHash(encoded);
    systemAdminRepository.save(admin);
  }

  private void assertCurrentPasswordMatches(String rawPassword, String passwordHash) {
    if (!passwordEncoder.matches(rawPassword, Optional.ofNullable(passwordHash).orElse(""))) {
      throw ExceptionBuilder.unauthorized("Current password is incorrect");
    }
  }

  public boolean isEmailExisted(String email) {
    return readerRepository.existsByEmail(email)
        || reviewerRepository.existsByEmail(email)
        || organizationRepository.existsByEmail(email)
        || systemAdminRepository.existsByEmail(email)
        || businessAdminRepository.existsByEmail(email);
  }
}
