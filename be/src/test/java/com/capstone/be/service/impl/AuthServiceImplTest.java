package com.capstone.be.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.capstone.be.domain.entity.BusinessAdmin;
import com.capstone.be.domain.entity.Organization;
import com.capstone.be.domain.entity.Reader;
import com.capstone.be.domain.entity.Reviewer;
import com.capstone.be.domain.entity.SystemAdmin;
import com.capstone.be.domain.enums.ReaderStatus;
import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.dto.request.LoginRequest;
import com.capstone.be.dto.response.LoginResponse;
import com.capstone.be.repository.BusinessAdminRepository;
import com.capstone.be.repository.OrganizationRepository;
import com.capstone.be.repository.ReaderRepository;
import com.capstone.be.repository.ReviewerRepository;
import com.capstone.be.repository.SystemAdminRepository;
import com.capstone.be.security.service.JwtService;
import com.capstone.be.service.AuthService;
import java.util.Optional;
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

  @Mock
  private ReaderRepository readerRepository;
  @Mock
  private ReviewerRepository reviewerRepository;
  @Mock
  private OrganizationRepository organizationRepository;
  @Mock
  private BusinessAdminRepository businessAdminRepository;
  @Mock
  private SystemAdminRepository systemAdminRepository;
  @Mock
  private PasswordEncoder passwordEncoder;
  @Mock
  private JwtService jwtService;

  private AuthService authService;

  @BeforeEach
  void setUp() {
    authService = new AuthServiceImpl(readerRepository, reviewerRepository, organizationRepository,
        businessAdminRepository, systemAdminRepository, passwordEncoder, jwtService);
  }

  @Test
  void login_readerSuccess() {
    Reader reader = new Reader();
    reader.setId(1L);
    reader.setEmail("reader@example.com");
    reader.setUsername("reader");
    reader.setPasswordHash(PASSWORD_HASH);
    reader.setStatus(ReaderStatus.VERIFIED);

    when(readerRepository.findByEmail(reader.getEmail())).thenReturn(Optional.of(reader));
    when(passwordEncoder.matches(PASSWORD, PASSWORD_HASH)).thenReturn(true);
    when(jwtService.generateToken(reader.getId(), UserRole.READER, reader.getEmail()))
        .thenReturn("token");
    when(jwtService.getExpirationMs()).thenReturn(3600L);

    LoginRequest request = LoginRequest.builder()
        .role(UserRole.READER)
        .email(reader.getEmail())
        .password(PASSWORD)
        .build();

    LoginResponse response = authService.login(request);

    assertEquals("token", response.getAccessToken());
    assertEquals("Bearer", response.getTokenType());
    assertEquals(3600L, response.getExpiresIn());
    assertEquals(reader.getId(), response.getSubjectId());
    assertEquals(UserRole.READER, response.getRole());
    assertEquals(reader.getEmail(), response.getEmail());
    assertEquals(reader.getUsername(), response.getDisplayName());
  }

  @Test
  void login_readerInvalidPasswordThrowsUnauthorized() {
    Reader reader = new Reader();
    reader.setId(1L);
    reader.setEmail("reader@example.com");
    reader.setPasswordHash(PASSWORD_HASH);

    when(readerRepository.findByEmail(reader.getEmail())).thenReturn(Optional.of(reader));
    when(passwordEncoder.matches(PASSWORD, PASSWORD_HASH)).thenReturn(false);

    LoginRequest request = LoginRequest.builder()
        .role(UserRole.READER)
        .email(reader.getEmail())
        .password(PASSWORD)
        .build();

    ResponseStatusException ex = assertThrows(ResponseStatusException.class,
        () -> authService.login(request));

    assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
    verify(jwtService, never()).generateToken(anyLong(), any(UserRole.class), anyString());
  }

  @Test
  void login_readerDisabledThrowsUnauthorized() {
    Reader reader = new Reader();
    reader.setId(1L);
    reader.setEmail("reader@example.com");
    reader.setUsername("reader");
    reader.setPasswordHash(PASSWORD_HASH);
    reader.setDeleted(true);

    when(readerRepository.findByEmail(reader.getEmail())).thenReturn(Optional.of(reader));
    when(passwordEncoder.matches(PASSWORD, PASSWORD_HASH)).thenReturn(true);

    LoginRequest request = LoginRequest.builder()
        .role(UserRole.READER)
        .email(reader.getEmail())
        .password(PASSWORD)
        .build();

    ResponseStatusException ex = assertThrows(ResponseStatusException.class,
        () -> authService.login(request));

    assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
    verify(jwtService, never()).generateToken(anyLong(), any(UserRole.class), anyString());
  }

  @Test
  void login_readerNotFoundThrowsUnauthorized() {
    String email = "missing@example.com";
    when(readerRepository.findByEmail(email)).thenReturn(Optional.empty());

    LoginRequest request = LoginRequest.builder()
        .role(UserRole.READER)
        .email(email)
        .password(PASSWORD)
        .build();

    ResponseStatusException ex = assertThrows(ResponseStatusException.class,
        () -> authService.login(request));

    assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
  }

  @Test
  void login_reviewerSuccess() {
    Reviewer reviewer = new Reviewer();
    reviewer.setId(5L);
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

    LoginRequest request = LoginRequest.builder()
        .role(UserRole.REVIEWER)
        .email(reviewer.getEmail())
        .password(PASSWORD)
        .build();

    LoginResponse response = authService.login(request);

    assertEquals(reviewer.getId(), response.getSubjectId());
    assertEquals(reviewer.getName(), response.getDisplayName());
    assertEquals(7200L, response.getExpiresIn());
  }

  @Test
  void login_reviewerInactiveThrowsUnauthorized() {
    Reviewer reviewer = new Reviewer();
    reviewer.setId(5L);
    reviewer.setEmail("reviewer@example.com");
    reviewer.setPasswordHash(PASSWORD_HASH);
    reviewer.setActive(false);
    reviewer.setDeleted(false);

    when(reviewerRepository.findByEmail(reviewer.getEmail())).thenReturn(Optional.of(reviewer));
    when(passwordEncoder.matches(PASSWORD, PASSWORD_HASH)).thenReturn(true);

    LoginRequest request = LoginRequest.builder()
        .role(UserRole.REVIEWER)
        .email(reviewer.getEmail())
        .password(PASSWORD)
        .build();

    ResponseStatusException ex = assertThrows(ResponseStatusException.class,
        () -> authService.login(request));

    assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
    verify(jwtService, never()).generateToken(anyLong(), any(UserRole.class), anyString());
  }

  @Test
  void login_organizationSuccess() {
    Organization organization = new Organization();
    organization.setId(7L);
    organization.setAdminEmail("admin@org.com");
    organization.setAdminName("Org Admin");
    organization.setAdminPassword(PASSWORD_HASH);
    organization.setActive(true);
    organization.setDeleted(false);

    when(organizationRepository.findByAdminEmail(organization.getAdminEmail()))
        .thenReturn(Optional.of(organization));
    when(passwordEncoder.matches(PASSWORD, PASSWORD_HASH)).thenReturn(true);
    when(jwtService.generateToken(organization.getId(), UserRole.ORGANIZATION,
        organization.getAdminEmail())).thenReturn("token");
    when(jwtService.getExpirationMs()).thenReturn(5400L);

    LoginRequest request = LoginRequest.builder()
        .role(UserRole.ORGANIZATION)
        .email(organization.getAdminEmail())
        .password(PASSWORD)
        .build();

    LoginResponse response = authService.login(request);

    assertEquals(organization.getAdminName(), response.getDisplayName());
    assertEquals(5400L, response.getExpiresIn());
  }

  @Test
  void login_organizationInactiveThrowsUnauthorized() {
    Organization organization = new Organization();
    organization.setId(7L);
    organization.setAdminEmail("admin@org.com");
    organization.setAdminPassword(PASSWORD_HASH);
    organization.setActive(false);
    organization.setDeleted(false);

    when(organizationRepository.findByAdminEmail(organization.getAdminEmail()))
        .thenReturn(Optional.of(organization));
    when(passwordEncoder.matches(PASSWORD, PASSWORD_HASH)).thenReturn(true);

    LoginRequest request = LoginRequest.builder()
        .role(UserRole.ORGANIZATION)
        .email(organization.getAdminEmail())
        .password(PASSWORD)
        .build();

    ResponseStatusException ex = assertThrows(ResponseStatusException.class,
        () -> authService.login(request));

    assertEquals(HttpStatus.UNAUTHORIZED, ex.getStatusCode());
    verify(jwtService, never()).generateToken(any(), any(), any());
  }

  @Test
  void login_businessAdminSuccess() {
    BusinessAdmin admin = new BusinessAdmin();
    admin.setId(9L);
    admin.setEmail("biz@example.com");
    admin.setFullName("Biz Admin");
    admin.setPasswordHash(PASSWORD_HASH);
    admin.setActive(true);
    admin.setDeleted(false);

    when(businessAdminRepository.findByEmail(admin.getEmail())).thenReturn(Optional.of(admin));
    when(passwordEncoder.matches(PASSWORD, PASSWORD_HASH)).thenReturn(true);
    when(jwtService.generateToken(admin.getId(), UserRole.BUSINESS_ADMIN, admin.getEmail()))
        .thenReturn("token");
    when(jwtService.getExpirationMs()).thenReturn(6000L);

    LoginRequest request = LoginRequest.builder()
        .role(UserRole.BUSINESS_ADMIN)
        .email(admin.getEmail())
        .password(PASSWORD)
        .build();

    LoginResponse response = authService.login(request);

    assertEquals(admin.getFullName(), response.getDisplayName());
    assertEquals(6000L, response.getExpiresIn());
  }

  @Test
  void login_systemAdminSuccess() {
    SystemAdmin admin = new SystemAdmin();
    admin.setId(11L);
    admin.setEmail("sys@example.com");
    admin.setFullName("Sys Admin");
    admin.setPasswordHash(PASSWORD_HASH);
    admin.setActive(true);
    admin.setDeleted(false);

    when(systemAdminRepository.findByEmail(admin.getEmail())).thenReturn(Optional.of(admin));
    when(passwordEncoder.matches(PASSWORD, PASSWORD_HASH)).thenReturn(true);
    when(jwtService.generateToken(admin.getId(), UserRole.SYSTEM_ADMIN, admin.getEmail()))
        .thenReturn("token");
    when(jwtService.getExpirationMs()).thenReturn(4800L);

    LoginRequest request = LoginRequest.builder()
        .role(UserRole.SYSTEM_ADMIN)
        .email(admin.getEmail())
        .password(PASSWORD)
        .build();

    LoginResponse response = authService.login(request);

    assertEquals(admin.getFullName(), response.getDisplayName());
    assertEquals(4800L, response.getExpiresIn());
  }
}
