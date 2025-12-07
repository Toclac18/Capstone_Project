package com.capstone.be.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

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
import com.capstone.be.mapper.AuthMapper;
import com.capstone.be.repository.DomainRepository;
import com.capstone.be.repository.OrgEnrollmentRepository;
import com.capstone.be.repository.OrganizationProfileRepository;
import com.capstone.be.repository.ReaderProfileRepository;
import com.capstone.be.repository.ReviewerDomainLinkRepository;
import com.capstone.be.repository.ReviewerProfileRepository;
import com.capstone.be.repository.ReviewerSpecLinkRepository;
import com.capstone.be.repository.SpecializationRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.security.jwt.JwtUtil;
import com.capstone.be.security.model.UserPrincipal;
import com.capstone.be.service.AuditLogService;
import com.capstone.be.service.EmailService;
import com.capstone.be.service.FileStorageService;
import com.capstone.be.service.impl.AuthServiceImpl;
import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Unit Tests")
class AuthServiceTest {

  @Mock
  private UserRepository userRepository;

  @Mock
  private ReaderProfileRepository readerProfileRepository;

  @Mock
  private ReviewerProfileRepository reviewerProfileRepository;

  @Mock
  private OrganizationProfileRepository organizationProfileRepository;

  @Mock
  private DomainRepository domainRepository;

  @Mock
  private SpecializationRepository specializationRepository;

  @Mock
  private ReviewerDomainLinkRepository reviewerDomainLinkRepository;

  @Mock
  private ReviewerSpecLinkRepository reviewerSpecLinkRepository;

  @Mock
  private OrgEnrollmentRepository orgEnrollmentRepository;

  @Mock
  private PasswordEncoder passwordEncoder;

  @Mock
  private JwtUtil jwtUtil;

  @Mock
  private AuthenticationManager authenticationManager;

  @Mock
  private EmailService emailService;

  @Mock
  private FileStorageService fileStorageService;

  @Mock
  private AuthMapper authMapper;

  @Mock
  private AuditLogService auditLogService;

  @Mock
  private HttpServletRequest httpRequest;

  @InjectMocks
  private AuthServiceImpl authService;

  private User user;
  private UUID userId;
  private RegisterReaderRequest registerRequest;
  private LoginRequest loginRequest;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();

    user = User.builder()
        .id(userId)
        .email("test@example.com")
        .passwordHash("encodedPassword")
        .fullName("Test User")
        .role(UserRole.READER)
        .status(UserStatus.PENDING_EMAIL_VERIFY)
        .createdAt(Instant.now())
        .updatedAt(Instant.now())
        .build();

    registerRequest = RegisterReaderRequest.builder()
        .email("newuser@example.com")
        .password("password123")
        .fullName("New User")
        .dateOfBirth(LocalDate.of(1990, 1, 1))
        .build();

    loginRequest = LoginRequest.builder()
        .email("test@example.com")
        .password("password123")
        .role(UserRole.READER)
        .build();
  }

  // test registerReader should create new reader successfully
  @Test
  @DisplayName("registerReader should create new reader successfully")
  void registerReader_ShouldCreateReader() {
    User newUser = User.builder()
        .id(userId)
        .email(registerRequest.getEmail())
        .fullName(registerRequest.getFullName())
        .role(UserRole.READER)
        .status(UserStatus.PENDING_EMAIL_VERIFY)
        .build();

    ReaderProfile readerProfile = ReaderProfile.builder()
        .user(newUser)
        .build();

    AuthResponse authResponse = AuthResponse.builder()
        .userId(newUser.getId())
        .email(newUser.getEmail())
        .fullName(newUser.getFullName())
        .role(newUser.getRole())
        .status(newUser.getStatus())
        .build();

    when(userRepository.existsByEmail(registerRequest.getEmail())).thenReturn(false);
    when(authMapper.toUserEntity(registerRequest)).thenReturn(newUser);
    when(passwordEncoder.encode(registerRequest.getPassword())).thenReturn("encodedPassword");
    when(userRepository.save(any(User.class))).thenReturn(newUser);
    when(authMapper.toReaderProfile(registerRequest)).thenReturn(readerProfile);
    when(readerProfileRepository.save(any(ReaderProfile.class))).thenReturn(readerProfile);
    when(orgEnrollmentRepository.findByMemberEmailAndMemberIsNull(anyString()))
        .thenReturn(Collections.emptyList());
    when(jwtUtil.generateEmailVerificationToken(any(UUID.class), anyString()))
        .thenReturn("verificationToken");
    when(authMapper.toAuthResponse(newUser)).thenReturn(authResponse);

    AuthResponse result = authService.registerReader(registerRequest);

    assertNotNull(result);
    assertEquals(registerRequest.getEmail(), result.getEmail());
    assertEquals(UserStatus.PENDING_EMAIL_VERIFY, result.getStatus());
    verify(userRepository, times(1)).save(any(User.class));
    verify(emailService, times(1)).sendEmailVerification(any(), anyString(), anyString());
  }

  // test registerReader should throw exception when email exists
  @Test
  @DisplayName("registerReader should throw exception when email exists")
  void registerReader_ShouldThrowException_WhenEmailExists() {
    when(userRepository.existsByEmail(registerRequest.getEmail())).thenReturn(true);

    assertThrows(DuplicateResourceException.class,
        () -> authService.registerReader(registerRequest));
    verify(userRepository, never()).save(any());
  }

  // test verifyEmail should activate reader account
  @Test
  @DisplayName("verifyEmail should activate reader account")
  void verifyEmail_ShouldActivateReader() {
    User activeUser = User.builder()
        .id(userId)
        .email("test@example.com")
        .role(UserRole.READER)
        .status(UserStatus.ACTIVE)
        .build();

    AuthResponse authResponse = AuthResponse.builder()
        .userId(userId)
        .email("test@example.com")
        .role(UserRole.READER)
        .status(UserStatus.ACTIVE)
        .accessToken("accessToken")
        .build();

    when(jwtUtil.validateToken("validToken")).thenReturn(true);
    when(jwtUtil.getEmailFromToken("validToken")).thenReturn("test@example.com");
    when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
    when(userRepository.save(any(User.class))).thenReturn(activeUser);
    when(jwtUtil.generateToken(any(UUID.class), anyString(), anyString()))
        .thenReturn("accessToken");
    when(authMapper.toAuthResponseWithToken(any(User.class), eq("accessToken")))
        .thenReturn(authResponse);

    AuthResponse result = authService.verifyEmail("validToken");

    assertNotNull(result);
    assertEquals(UserStatus.ACTIVE, result.getStatus());
    assertNotNull(result.getAccessToken());
    verify(userRepository, times(1)).save(any(User.class));
  }

  // test verifyEmail should set reviewer to pending approval
  @Test
  @DisplayName("verifyEmail should set reviewer to pending approval")
  void verifyEmail_ShouldSetReviewerPendingApproval() {
    User reviewerUser = User.builder()
        .id(userId)
        .email("reviewer@example.com")
        .role(UserRole.REVIEWER)
        .status(UserStatus.PENDING_EMAIL_VERIFY)
        .build();

    User pendingUser = User.builder()
        .id(userId)
        .email("reviewer@example.com")
        .role(UserRole.REVIEWER)
        .status(UserStatus.PENDING_APPROVE)
        .build();

    AuthResponse authResponse = AuthResponse.builder()
        .userId(userId)
        .email("reviewer@example.com")
        .role(UserRole.REVIEWER)
        .status(UserStatus.PENDING_APPROVE)
        .build();

    when(jwtUtil.validateToken("validToken")).thenReturn(true);
    when(jwtUtil.getEmailFromToken("validToken")).thenReturn("reviewer@example.com");
    when(userRepository.findByEmail("reviewer@example.com")).thenReturn(Optional.of(reviewerUser));
    when(userRepository.save(any(User.class))).thenReturn(pendingUser);
    when(authMapper.toAuthResponseWithToken(any(User.class), eq(null)))
        .thenReturn(authResponse);

    AuthResponse result = authService.verifyEmail("validToken");

    assertEquals(UserStatus.PENDING_APPROVE, result.getStatus());
    assertNull(result.getAccessToken());
  }

  // test verifyEmail should throw exception when token invalid
  @Test
  @DisplayName("verifyEmail should throw exception when token invalid")
  void verifyEmail_ShouldThrowException_WhenTokenInvalid() {
    when(jwtUtil.validateToken("invalidToken")).thenReturn(false);

    assertThrows(UnauthorizedException.class,
        () -> authService.verifyEmail("invalidToken"));
    verify(userRepository, never()).findByEmail(anyString());
  }

  // test verifyEmail should throw exception when user not found
  @Test
  @DisplayName("verifyEmail should throw exception when user not found")
  void verifyEmail_ShouldThrowException_WhenUserNotFound() {
    when(jwtUtil.validateToken("validToken")).thenReturn(true);
    when(jwtUtil.getEmailFromToken("validToken")).thenReturn("notfound@example.com");
    when(userRepository.findByEmail("notfound@example.com")).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> authService.verifyEmail("validToken"));
  }

  // test verifyEmail should throw exception when account pending approval
  @Test
  @DisplayName("verifyEmail should throw exception when account pending approval")
  void verifyEmail_ShouldThrowException_WhenPendingApproval() {
    User pendingUser = User.builder()
        .id(userId)
        .email("test@example.com")
        .role(UserRole.REVIEWER)
        .status(UserStatus.PENDING_APPROVE)
        .build();

    when(jwtUtil.validateToken("validToken")).thenReturn(true);
    when(jwtUtil.getEmailFromToken("validToken")).thenReturn("test@example.com");
    when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(pendingUser));

    assertThrows(UnauthorizedException.class,
        () -> authService.verifyEmail("validToken"));
  }

  // test login should return token for active user
  @Test
  @DisplayName("login should return token for active user")
  void login_ShouldReturnToken() {
    UserPrincipal userPrincipal = new UserPrincipal(
        userId,
        "test@example.com",
        "password",
        "Test User",
        "READER",
        UserStatus.ACTIVE
    );

    Authentication authentication = org.mockito.Mockito.mock(Authentication.class);
    when(authentication.getPrincipal()).thenReturn(userPrincipal);

    when(httpRequest.getHeader("X-Forwarded-For")).thenReturn(null);
    when(httpRequest.getHeader("X-Real-IP")).thenReturn(null);
    when(httpRequest.getHeader("Proxy-Client-IP")).thenReturn(null);
    when(httpRequest.getHeader("WL-Proxy-Client-IP")).thenReturn(null);
    when(httpRequest.getRemoteAddr()).thenReturn("127.0.0.1");
    when(httpRequest.getHeader("User-Agent")).thenReturn("TestAgent");
    when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
        .thenReturn(authentication);
    when(jwtUtil.generateToken(userId, "test@example.com", "READER"))
        .thenReturn("accessToken");

    AuthResponse authResponse = AuthResponse.builder()
        .userId(userId)
        .email("test@example.com")
        .role(UserRole.READER)
        .status(UserStatus.ACTIVE)
        .accessToken("accessToken")
        .build();

    when(authMapper.toAuthResponseWithToken(any(UserPrincipal.class), eq("accessToken")))
        .thenReturn(authResponse);

    AuthResponse result = authService.login(loginRequest, httpRequest);
    
    verify(auditLogService, times(1)).logAction(any(), any(), any(), anyString(), anyString(), any());

    assertNotNull(result);
    assertNotNull(result.getAccessToken());
    verify(authenticationManager, times(1)).authenticate(any());
  }

  // test login should throw exception when wrong credentials
  @Test
  @DisplayName("login should throw exception when wrong credentials")
  void login_ShouldThrowException_WhenWrongCredentials() {
    when(httpRequest.getHeader("X-Forwarded-For")).thenReturn(null);
    when(httpRequest.getHeader("X-Real-IP")).thenReturn(null);
    when(httpRequest.getHeader("Proxy-Client-IP")).thenReturn(null);
    when(httpRequest.getHeader("WL-Proxy-Client-IP")).thenReturn(null);
    when(httpRequest.getRemoteAddr()).thenReturn("127.0.0.1");
    when(httpRequest.getHeader("User-Agent")).thenReturn("TestAgent");
    when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
        .thenThrow(new BadCredentialsException("Bad credentials"));

    assertThrows(BadCredentialsException.class,
        () -> authService.login(loginRequest, httpRequest));
    
    verify(auditLogService, times(1)).logFailedAction(any(), any(), any(), anyString(), anyString(), anyString(), any());
  }

  // test login should throw exception when role mismatch
  @Test
  @DisplayName("login should throw exception when role mismatch")
  void login_ShouldThrowException_WhenRoleMismatch() {
    UserPrincipal userPrincipal = new UserPrincipal(
        userId,
        "test@example.com",
        "password",
        "Test User",
        "REVIEWER",
        UserStatus.ACTIVE
    );

    Authentication authentication = org.mockito.Mockito.mock(Authentication.class);
    when(authentication.getPrincipal()).thenReturn(userPrincipal);

    when(httpRequest.getHeader("X-Forwarded-For")).thenReturn(null);
    when(httpRequest.getHeader("X-Real-IP")).thenReturn(null);
    when(httpRequest.getHeader("Proxy-Client-IP")).thenReturn(null);
    when(httpRequest.getHeader("WL-Proxy-Client-IP")).thenReturn(null);
    when(httpRequest.getRemoteAddr()).thenReturn("127.0.0.1");
    when(httpRequest.getHeader("User-Agent")).thenReturn("TestAgent");
    when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
        .thenReturn(authentication);

    assertThrows(UnauthorizedException.class,
        () -> authService.login(loginRequest, httpRequest));
    
    verify(auditLogService, times(1)).logFailedAction(any(), any(), any(), anyString(), anyString(), anyString(), any());
  }

  // test login should throw exception when account disabled
  @Test
  @DisplayName("login should throw exception when account disabled")
  void login_ShouldThrowException_WhenAccountDisabled() {
    UserPrincipal userPrincipal = new UserPrincipal(
        userId,
        "test@example.com",
        "password",
        "Test User",
        "READER",
        UserStatus.INACTIVE
    );

    Authentication authentication = org.mockito.Mockito.mock(Authentication.class);
    when(authentication.getPrincipal()).thenReturn(userPrincipal);

    when(httpRequest.getHeader("X-Forwarded-For")).thenReturn(null);
    when(httpRequest.getHeader("X-Real-IP")).thenReturn(null);
    when(httpRequest.getHeader("Proxy-Client-IP")).thenReturn(null);
    when(httpRequest.getHeader("WL-Proxy-Client-IP")).thenReturn(null);
    when(httpRequest.getRemoteAddr()).thenReturn("127.0.0.1");
    when(httpRequest.getHeader("User-Agent")).thenReturn("TestAgent");
    when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
        .thenReturn(authentication);

    assertThrows(UnauthorizedException.class,
        () -> authService.login(loginRequest, httpRequest));
    
    verify(auditLogService, times(1)).logFailedAction(any(), any(), any(), anyString(), anyString(), anyString(), any());
  }

  // test resendVerificationEmail should send email
  @Test
  @DisplayName("resendVerificationEmail should send email")
  void resendVerificationEmail_ShouldSendEmail() {
    when(userRepository.findByEmail("test@example.com")).thenReturn(Optional.of(user));
    when(jwtUtil.generateEmailVerificationToken(userId, "test@example.com"))
        .thenReturn("newToken");

    authService.resendVerificationEmail("test@example.com");

    verify(emailService, times(1)).sendEmailVerification(userId, "test@example.com", "newToken");
  }

  // test resendVerificationEmail should throw exception when user not found
  @Test
  @DisplayName("resendVerificationEmail should throw exception when user not found")
  void resendVerificationEmail_ShouldThrowException_WhenUserNotFound() {
    when(userRepository.findByEmail("notfound@example.com")).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> authService.resendVerificationEmail("notfound@example.com"));
    verify(emailService, never()).sendEmailVerification(any(), anyString(), anyString());
  }
}

