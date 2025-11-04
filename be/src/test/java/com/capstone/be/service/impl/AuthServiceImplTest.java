package com.capstone.be.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.capstone.be.domain.entity.BusinessAdmin;
import com.capstone.be.domain.entity.Reader;
import com.capstone.be.domain.entity.Reviewer;
import com.capstone.be.domain.entity.SystemAdmin;
import com.capstone.be.domain.enums.ReaderStatus;
import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.dto.request.auth.ChangePasswordRequest;
import com.capstone.be.dto.request.auth.LoginRequest;
import com.capstone.be.dto.response.auth.LoginResponse;
import com.capstone.be.repository.BusinessAdminRepository;
import com.capstone.be.repository.OrganizationRepository;
import com.capstone.be.repository.ReaderRepository;
import com.capstone.be.repository.ReviewerRepository;
import com.capstone.be.repository.SystemAdminRepository;
import com.capstone.be.security.service.JwtService;
import com.capstone.be.service.AuthService;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

@ExtendWith(MockitoExtension.class)
class AuthServiceImplTest {

  private static final String PASSWORD = "password";
  private static final String PASSWORD_HASH = "hashed";
  private static final String NEW_PASSWORD = "newPassword";
  private static final String NEW_PASSWORD_HASH = "newHashed";

  @Mock private ReaderRepository readerRepository;
  @Mock private ReviewerRepository reviewerRepository;
  @Mock private OrganizationRepository organizationRepository;
  @Mock private BusinessAdminRepository businessAdminRepository;
  @Mock private SystemAdminRepository systemAdminRepository;
  @Mock private PasswordEncoder passwordEncoder;
  @Mock private JwtService jwtService;

  private AuthService authService;

  @BeforeEach
  void setUp() {
    authService =
        new AuthServiceImpl(
            readerRepository,
            reviewerRepository,
            organizationRepository,
            businessAdminRepository,
            systemAdminRepository,
            passwordEncoder,
            jwtService);
  }

  @Test
  void login_readerSuccess() {
    UUID readerId = UUID.randomUUID();
    Reader reader = new Reader();
    reader.setId(readerId);
    reader.setEmail("reader@example.com");
    reader.setUsername("reader");
    reader.setPasswordHash(PASSWORD_HASH);
    reader.setStatus(ReaderStatus.ACTIVE);

    when(readerRepository.findByEmail(reader.getEmail())).thenReturn(Optional.of(reader));
    when(passwordEncoder.matches(PASSWORD, PASSWORD_HASH)).thenReturn(true);
    when(jwtService.generateToken(reader.getId(), UserRole.READER, reader.getEmail()))
        .thenReturn("token");
    when(jwtService.getExpirationMs()).thenReturn(3600L);

    LoginRequest request =
        LoginRequest.builder()
            .role(UserRole.READER)
            .email(reader.getEmail())
            .password(PASSWORD)
            .build();

    LoginResponse response = authService.login(request);

    assertEquals("token", response.getAccessToken());
    assertEquals("Bearer", response.getTokenType());
    assertEquals(3600L, response.getExpiresIn());
    assertEquals(readerId.toString(), response.getSubjectId());
    assertEquals(UserRole.READER, response.getRole());
    assertEquals(reader.getEmail(), response.getEmail());
    assertEquals(reader.getUsername(), response.getDisplayName());
  }

  @Test
  void login_readerInvalidPasswordThrowsUnauthorized() {
    Reader reader = new Reader();
    reader.setId(UUID.randomUUID());
    reader.setEmail("reader@example.com");
    reader.setPasswordHash(PASSWORD_HASH);
    reader.setStatus(ReaderStatus.ACTIVE);

    when(readerRepository.findByEmail(reader.getEmail())).thenReturn(Optional.of(reader));
    when(passwordEncoder.matches(PASSWORD, PASSWORD_HASH)).thenReturn(false);

    LoginRequest request =
        LoginRequest.builder()
            .role(UserRole.READER)
            .email(reader.getEmail())
            .password(PASSWORD)
            .build();

    ResponseStatusException ex =
        assertThrows(ResponseStatusException.class, () -> authService.login(request));

    assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
    verify(jwtService, never()).generateToken(any(UUID.class), any(UserRole.class), anyString());
  }

  @Test
  void login_readerInactiveThrowsUnauthorized() {
    Reader reader = new Reader();
    reader.setId(UUID.randomUUID());
    reader.setEmail("reader@example.com");
    reader.setPasswordHash(PASSWORD_HASH);
    reader.setStatus(ReaderStatus.PENDING_VERIFICATION);

    when(readerRepository.findByEmail(reader.getEmail())).thenReturn(Optional.of(reader));
    when(passwordEncoder.matches(PASSWORD, PASSWORD_HASH)).thenReturn(true);

    LoginRequest request =
        LoginRequest.builder()
            .role(UserRole.READER)
            .email(reader.getEmail())
            .password(PASSWORD)
            .build();

    ResponseStatusException ex =
        assertThrows(ResponseStatusException.class, () -> authService.login(request));

    assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
    verify(jwtService, never()).generateToken(any(UUID.class), any(UserRole.class), anyString());
  }

  @Test
  void login_readerNotFoundThrowsUnauthorized() {
    String email = "missing@example.com";
    when(readerRepository.findByEmail(email)).thenReturn(Optional.empty());

    LoginRequest request =
        LoginRequest.builder().role(UserRole.READER).email(email).password(PASSWORD).build();

    ResponseStatusException ex =
        assertThrows(ResponseStatusException.class, () -> authService.login(request));

    assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
  }

  @Test
  void login_reviewerSuccess() {
    UUID reviewerId = UUID.randomUUID();
    Reviewer reviewer = new Reviewer();
    reviewer.setId(reviewerId);
    reviewer.setEmail("reviewer@example.com");
    reviewer.setName("Reviewer");
    reviewer.setPasswordHash(PASSWORD_HASH);
    reviewer.setActive(true);
    reviewer.setDeleted(false);

    when(reviewerRepository.findByEmail(reviewer.getEmail())).thenReturn(Optional.of(reviewer));
    when(passwordEncoder.matches(PASSWORD, PASSWORD_HASH)).thenReturn(true);
    when(jwtService.generateToken(reviewer.getId(), UserRole.REVIEWER, reviewer.getEmail()))
        .thenReturn("token");
    when(jwtService.getExpirationMs()).thenReturn(7200L);

    LoginRequest request =
        LoginRequest.builder()
            .role(UserRole.REVIEWER)
            .email(reviewer.getEmail())
            .password(PASSWORD)
            .build();

    LoginResponse response = authService.login(request);

    assertEquals(reviewerId.toString(), response.getSubjectId());
    assertEquals(reviewer.getName(), response.getDisplayName());
    assertEquals(7200L, response.getExpiresIn());
  }

  @Test
  void login_businessAdminAccountDisabledThrowsUnauthorized() {
    BusinessAdmin admin = new BusinessAdmin();
    admin.setId(UUID.randomUUID());
    admin.setEmail("biz@example.com");
    admin.setPasswordHash(PASSWORD_HASH);
    admin.setActive(false);
    admin.setDeleted(false);

    when(businessAdminRepository.findByEmail(admin.getEmail())).thenReturn(Optional.of(admin));
    when(passwordEncoder.matches(PASSWORD, PASSWORD_HASH)).thenReturn(true);

    LoginRequest request =
        LoginRequest.builder()
            .role(UserRole.BUSINESS_ADMIN)
            .email(admin.getEmail())
            .password(PASSWORD)
            .build();

    ResponseStatusException ex =
        assertThrows(ResponseStatusException.class, () -> authService.login(request));

    assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
    verify(jwtService, never()).generateToken(any(UUID.class), any(UserRole.class), anyString());
  }

  @Test
  void changePassword_readerSuccess() {
    Reader reader = new Reader();
    reader.setId(UUID.randomUUID());
    reader.setPasswordHash(PASSWORD_HASH);
    reader.setStatus(ReaderStatus.ACTIVE);

    when(readerRepository.findById(reader.getId())).thenReturn(Optional.of(reader));
    when(passwordEncoder.matches(PASSWORD, PASSWORD_HASH)).thenReturn(true);
    when(passwordEncoder.encode(NEW_PASSWORD)).thenReturn(NEW_PASSWORD_HASH);

    ChangePasswordRequest request =
        ChangePasswordRequest.builder().currentPassword(PASSWORD).newPassword(NEW_PASSWORD).build();

    authService.changePassword(reader.getId(), UserRole.READER, request);

    assertEquals(NEW_PASSWORD_HASH, reader.getPasswordHash());
    verify(readerRepository).save(reader);
  }

  @Test
  void changePassword_readerInvalidCurrentPasswordThrows() {
    Reader reader = new Reader();
    reader.setId(UUID.randomUUID());
    reader.setPasswordHash(PASSWORD_HASH);
    reader.setStatus(ReaderStatus.ACTIVE);

    when(readerRepository.findById(reader.getId())).thenReturn(Optional.of(reader));
    when(passwordEncoder.matches(PASSWORD, PASSWORD_HASH)).thenReturn(false);

    ChangePasswordRequest request =
        ChangePasswordRequest.builder().currentPassword(PASSWORD).newPassword(NEW_PASSWORD).build();

    ResponseStatusException ex =
        assertThrows(
            ResponseStatusException.class,
            () -> authService.changePassword(reader.getId(), UserRole.READER, request));

    assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
    verify(readerRepository, never()).save(any());
  }

  @Test
  void changePassword_readerNewPasswordSameAsCurrentThrows() {
    ChangePasswordRequest request =
        ChangePasswordRequest.builder().currentPassword(PASSWORD).newPassword(PASSWORD).build();

    ResponseStatusException ex =
        assertThrows(
            ResponseStatusException.class,
            () -> authService.changePassword(UUID.randomUUID(), UserRole.READER, request));

    assertEquals(HttpStatus.BAD_REQUEST, ex.getStatusCode());
  }

  @Test
  void changePassword_readerNotFoundThrows() {
    UUID readerId = UUID.randomUUID();
    when(readerRepository.findById(readerId)).thenReturn(Optional.empty());

    ChangePasswordRequest request =
        ChangePasswordRequest.builder().currentPassword(PASSWORD).newPassword(NEW_PASSWORD).build();

    ResponseStatusException ex =
        assertThrows(
            ResponseStatusException.class,
            () -> authService.changePassword(readerId, UserRole.READER, request));

    assertEquals(HttpStatus.NOT_FOUND, ex.getStatusCode());
  }

  @Test
  void changePassword_reviewerInactiveThrows() {
    Reviewer reviewer = new Reviewer();
    reviewer.setId(UUID.randomUUID());
    reviewer.setPasswordHash(PASSWORD_HASH);
    reviewer.setActive(false);
    reviewer.setDeleted(false);

    when(reviewerRepository.findById(reviewer.getId())).thenReturn(Optional.of(reviewer));

    ChangePasswordRequest request =
        ChangePasswordRequest.builder().currentPassword(PASSWORD).newPassword(NEW_PASSWORD).build();

    ResponseStatusException ex =
        assertThrows(
            ResponseStatusException.class,
            () -> authService.changePassword(reviewer.getId(), UserRole.REVIEWER, request));

    assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
    verify(passwordEncoder, never()).matches(anyString(), anyString());
    verify(reviewerRepository, never()).save(any());
  }

  @Test
  void changePassword_systemAdminSuccess() {
    SystemAdmin admin = new SystemAdmin();
    admin.setId(UUID.randomUUID());
    admin.setEmail("sys@example.com");
    admin.setPasswordHash(PASSWORD_HASH);
    admin.setActive(true);
    admin.setDeleted(false);

    when(systemAdminRepository.findById(admin.getId())).thenReturn(Optional.of(admin));
    when(passwordEncoder.matches(PASSWORD, PASSWORD_HASH)).thenReturn(true);
    when(passwordEncoder.encode(NEW_PASSWORD)).thenReturn(NEW_PASSWORD_HASH);

    ChangePasswordRequest request =
        ChangePasswordRequest.builder().currentPassword(PASSWORD).newPassword(NEW_PASSWORD).build();

    authService.changePassword(admin.getId(), UserRole.SYSTEM_ADMIN, request);

    assertEquals(NEW_PASSWORD_HASH, admin.getPasswordHash());
    verify(systemAdminRepository).save(admin);
  }
}
