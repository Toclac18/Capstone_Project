package com.capstone.be.service.impl;

import com.capstone.be.config.constant.FileStorage;
import com.capstone.be.domain.entity.Domain;
import com.capstone.be.domain.entity.OrgEnrollment;
import com.capstone.be.domain.entity.OrganizationProfile;
import com.capstone.be.domain.entity.ReaderProfile;
import com.capstone.be.domain.entity.ReviewerDomainLink;
import com.capstone.be.domain.entity.ReviewerProfile;
import com.capstone.be.domain.entity.ReviewerSpecLink;
import com.capstone.be.domain.entity.Specialization;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.domain.enums.UserStatus;
import com.capstone.be.dto.request.auth.LoginRequest;
import com.capstone.be.dto.request.auth.RegisterOrganizationRequest;
import com.capstone.be.dto.request.auth.RegisterReaderRequest;
import com.capstone.be.dto.request.auth.RegisterReviewerRequest;
import com.capstone.be.dto.response.auth.AuthResponse;
import com.capstone.be.exception.DuplicateResourceException;
import com.capstone.be.exception.InvalidRequestException;
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
import com.capstone.be.domain.enums.LogAction;
import com.capstone.be.service.AuditLogService;
import com.capstone.be.service.AuthService;
import com.capstone.be.service.EmailService;
import com.capstone.be.service.FileStorageService;
import com.capstone.be.service.helper.NotificationHelper;
import com.capstone.be.util.HttpRequestUtil;
import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

  private final UserRepository userRepository;
  private final ReaderProfileRepository readerProfileRepository;
  private final ReviewerProfileRepository reviewerProfileRepository;
  private final OrganizationProfileRepository organizationProfileRepository;
  private final DomainRepository domainRepository;
  private final SpecializationRepository specializationRepository;
  private final ReviewerDomainLinkRepository reviewerDomainLinkRepository;
  private final ReviewerSpecLinkRepository reviewerSpecLinkRepository;
  private final OrgEnrollmentRepository orgEnrollmentRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtUtil jwtUtil;
  private final AuthenticationManager authenticationManager;
  private final EmailService emailService;
  private final FileStorageService fileStorageService;
  private final AuthMapper authMapper;
  private final AuditLogService auditLogService;
  private final NotificationHelper notificationHelper;

  @Override
  @Transactional
  public AuthResponse registerReader(RegisterReaderRequest request) {
    // Normalize email to lowercase
    String normalizedEmail = request.getEmail().toLowerCase().trim();
    
    // Check if email already exists
    if (userRepository.existsByEmail(normalizedEmail)) {
      throw DuplicateResourceException.email(normalizedEmail);
    }

    // Set normalized email before mapping
    request.setEmail(normalizedEmail);
    
    // Map request to User entity
    User user = authMapper.toUserEntity(request);
    user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
    user.setRole(UserRole.READER);
    user.setStatus(UserStatus.PENDING_EMAIL_VERIFY);

    user = userRepository.save(user);
    log.info("Created user with id: {} - pending email verification", user.getId());

    // Map request to ReaderProfile and set user
    ReaderProfile readerProfile = authMapper.toReaderProfile(request);
    readerProfile.setUser(user);

    readerProfileRepository.save(readerProfile);
    log.info("Created reader profile for user id: {}", user.getId());

    // Link user to any pending enrollments with this email
    linkPendingEnrollments(user);

    // Generate email verification token (expires in 10 minutes)
    String verificationToken = jwtUtil.generateEmailVerificationToken(
        user.getId(),
        user.getEmail()
    );

    // Send verification email (async)
    emailService.sendEmailVerification(user.getId(), user.getEmail(), verificationToken);

    // Notify BUSINESS_ADMIN about new user registration
    notificationHelper.sendNotificationToBusinessAdmins(
        com.capstone.be.domain.enums.NotificationType.INFO,
        "New User Registration",
        String.format("A new READER has registered: %s (%s)", user.getFullName(), user.getEmail())
    );

    // Return response WITHOUT access token (user needs to verify email first)
    return authMapper.toAuthResponse(user);
  }

  /**
   * Link newly registered user to any pending organization enrollments created before registration
   */
  private void linkPendingEnrollments(User user) {
    List<OrgEnrollment> pendingEnrollments = orgEnrollmentRepository
        .findByMemberEmailAndMemberIsNull(user.getEmail());

    if (!pendingEnrollments.isEmpty()) {
      for (OrgEnrollment enrollment : pendingEnrollments) {
        enrollment.setMember(user);
      }
      orgEnrollmentRepository.saveAll(pendingEnrollments);
      log.info("Linked {} pending organization enrollments to user: {}",
          pendingEnrollments.size(), user.getEmail());
    }
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
    } else if (user.getStatus() == UserStatus.PENDING_APPROVE) {
      throw UnauthorizedException.accountPendingApproval();
    } else if (user.getStatus() != UserStatus.PENDING_EMAIL_VERIFY) {
      throw UnauthorizedException.accountDisabled();
    } else {
      // Update status based on role
      if (user.getRole() == UserRole.READER) {
        user.setStatus(UserStatus.ACTIVE);
        log.info("Reader {} email verified successfully - account activated", email);
        // Send welcome email (async, non-blocking)
        emailService.sendWelcomeEmail(user.getEmail(), user.getFullName());
      } else if (user.getRole() == UserRole.REVIEWER
          || user.getRole() == UserRole.ORGANIZATION_ADMIN) {
        user.setStatus(UserStatus.PENDING_APPROVE);
        log.info("{} {} email verified - waiting for admin approval",
            user.getRole(), email);
        // Don't send welcome email yet, wait for approval
      }
      userRepository.save(user);
    }

    // Generate access token only for ACTIVE users
    String accessToken = null;
    if (user.getStatus() == UserStatus.ACTIVE) {
      accessToken = jwtUtil.generateToken(
          user.getId(),
          user.getEmail(),
          user.getRole().name()
      );
    }

    return authMapper.toAuthResponseWithToken(user, accessToken);
  }

  @Override
  @Transactional(readOnly = true)
  public AuthResponse login(LoginRequest request, HttpServletRequest httpRequest) {
    String ipAddress = HttpRequestUtil.extractIpAddress(httpRequest);
    String userAgent = HttpRequestUtil.extractUserAgent(httpRequest);
    
    // Normalize email to lowercase
    String normalizedEmail = request.getEmail().toLowerCase().trim();
    
    try {
      // Authenticate user (will throw BadCredentialsException if wrong credentials)
      Authentication authentication = authenticationManager.authenticate(
          new UsernamePasswordAuthenticationToken(
              normalizedEmail,
              request.getPassword()
          )
      );

      UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

      if (request.getRole() != null && !principal.getRole().equals(request.getRole().name())) {
        // Log failed login - role mismatch
        Map<String, Object> details = new HashMap<>();
        details.put("email", request.getEmail());
        details.put("requestedRole", request.getRole().name());
        details.put("actualRole", principal.getRole());
        details.put("reason", "Role mismatch");
        auditLogService.logFailedAction(
            LogAction.USER_LOGIN_FAILED,
            principal,
            details,
            "Role mismatch: requested " + request.getRole().name() + " but user has " + principal.getRole(),
            ipAddress,
            userAgent,
            401 // HTTP 401 Unauthorized
        );
        throw UnauthorizedException.invalidCredentials();
      }

      if (!principal.isEnabled()) {
        // Log failed login - account disabled
        Map<String, Object> details = new HashMap<>();
        details.put("email", request.getEmail());
        details.put("reason", "Account disabled");
        auditLogService.logFailedAction(
            LogAction.USER_LOGIN_FAILED,
            principal,
            details,
            "Account is disabled",
            ipAddress,
            userAgent,
            401 // HTTP 401 Unauthorized
        );
        throw UnauthorizedException.accountDisabled();
      }

      String token = jwtUtil.generateToken(
          principal.getId(),
          principal.getEmail(),
          principal.getRole()
      );

      // Log successful login
      Map<String, Object> details = new HashMap<>();
      details.put("email", request.getEmail());
      details.put("role", principal.getRole());
      log.debug("Calling auditLogService.logAction for USER_LOGIN_SUCCESS, email: {}, IP: {}", 
          request.getEmail(), ipAddress);
      auditLogService.logAction(
          LogAction.USER_LOGIN_SUCCESS,
          principal,
          details,
          ipAddress,
          userAgent,
          200 // HTTP 200 OK for successful login
      );
      log.debug("auditLogService.logAction called successfully");

      return authMapper.toAuthResponseWithToken(principal, token);
    } catch (BadCredentialsException e) {
      Map<String, Object> details = new HashMap<>();
      details.put("email", request.getEmail());
      details.put("reason", "Invaild email or password");
      log.debug("Calling auditLogService.logFailedAction for USER_LOGIN_FAILED, email: {}, IP: {}", 
          request.getEmail(), ipAddress);
      auditLogService.logFailedAction(
          LogAction.USER_LOGIN_FAILED,
          null,
          details,
          "Invaild email or password",
          ipAddress,
          userAgent,
          401 // HTTP 401 Unauthorized
      );
      log.debug("auditLogService.logFailedAction called successfully");
      throw e;
    }
  }

  @Override
  @Transactional
  public AuthResponse registerOrganization(RegisterOrganizationRequest request,
      MultipartFile logoFile) {
    // Normalize emails to lowercase
    String normalizedAdminEmail = request.getAdminEmail().toLowerCase().trim();
    String normalizedOrgEmail = request.getOrganizationEmail().toLowerCase().trim();
    
    // Check if admin email already exists
    if (userRepository.existsByEmail(normalizedAdminEmail)) {
      throw DuplicateResourceException.email(normalizedAdminEmail);
    }

    // Check if organization name already exists
    if (organizationProfileRepository.existsByName(request.getOrganizationName())) {
      throw new DuplicateResourceException(
          "Organization name already exists: " + request.getOrganizationName());
    }

    // Check if organization email already exists
    if (organizationProfileRepository.existsByEmail(normalizedOrgEmail)) {
      throw new DuplicateResourceException(
          "Organization email already exists: " + normalizedOrgEmail);
    }
    
    // Set normalized emails before mapping
    request.setAdminEmail(normalizedAdminEmail);
    request.setOrganizationEmail(normalizedOrgEmail);

    // Check if registration number already exists
    if (organizationProfileRepository.existsByRegistrationNumber(
        request.getRegistrationNumber())) {
      throw new DuplicateResourceException(
          "Registration number already exists: " + request.getRegistrationNumber());
    }

    // Upload logo if provided
    String logoKey = null;
    if (logoFile != null && !logoFile.isEmpty()) {
      logoKey = fileStorageService.uploadFile(logoFile, FileStorage.ORG_LOGO_FOLDER, null);
      log.info("Uploaded organization logo to S3: {}", logoKey);
    }

    // Map request to User entity (Organization Admin)
    User admin = authMapper.toOrganizationAdminEntity(request);
    admin.setPasswordHash(passwordEncoder.encode(request.getPassword()));
    admin.setRole(UserRole.ORGANIZATION_ADMIN);
    admin.setStatus(UserStatus.PENDING_EMAIL_VERIFY);

    admin = userRepository.save(admin);
    log.info("Created organization admin user with id: {} - pending email verification",
        admin.getId());

    // Map request to OrganizationProfile
    OrganizationProfile organizationProfile = authMapper.toOrganizationProfile(request);
    organizationProfile.setAdmin(admin);
    organizationProfile.setLogoKey(logoKey);

    organizationProfileRepository.save(organizationProfile);
    log.info("Created organization profile for admin id: {}", admin.getId());

    // Generate email verification token (expires in 10 minutes)
    String verificationToken = jwtUtil.generateEmailVerificationToken(
        admin.getId(),
        admin.getEmail()
    );

    // Send verification email (async)
    emailService.sendEmailVerification(admin.getId(), admin.getEmail(), verificationToken);

    // Notify BUSINESS_ADMIN about new organization registration
    notificationHelper.sendNotificationToBusinessAdmins(
        com.capstone.be.domain.enums.NotificationType.INFO,
        "New Organization Registration",
        String.format("A new ORGANIZATION has registered: %s (Admin: %s)", 
            request.getOrganizationName(), admin.getEmail())
    );

    // Return response WITHOUT access token (user needs to verify email first)
    return authMapper.toAuthResponse(admin);
  }

  @Override
  @Transactional
  public AuthResponse registerReviewer(RegisterReviewerRequest request,
      List<MultipartFile> credentialFiles) {
    // Normalize emails to lowercase
    String normalizedEmail = request.getEmail().toLowerCase().trim();
    String normalizedOrgEmail = request.getOrganizationEmail().toLowerCase().trim();
    
    // Check if email already exists
    if (userRepository.existsByEmail(normalizedEmail)) {
      throw DuplicateResourceException.email(normalizedEmail);
    }
    
    // Set normalized emails before mapping
    request.setEmail(normalizedEmail);
    request.setOrganizationEmail(normalizedOrgEmail);

    // Validate credential files
    if (credentialFiles == null || credentialFiles.isEmpty()) {
      throw new InvalidRequestException("At least one credential file is required");
    }
    if (credentialFiles.size() > 10) {
      throw new InvalidRequestException("Maximum 10 credential files allowed");
    }

    // Validate domains (1-3)
    List<Domain> domains = domainRepository.findAllByIdIn(request.getDomainIds());
    if (domains.size() != request.getDomainIds().size()) {
      throw new ResourceNotFoundException("One or more domains not found");
    }

    // Validate specializations (1-5)
    List<Specialization> specializations = specializationRepository.findAllByIdIn(
        request.getSpecializationIds());
    if (specializations.size() != request.getSpecializationIds().size()) {
      throw new ResourceNotFoundException("One or more specializations not found");
    }

    //Validate specializations in correct Domain
    for (Specialization spec : specializations) {
      boolean domainNotExisted = domains.stream().filter(
          domain -> domain.getId().equals(spec.getDomain().getId())).toList().isEmpty();
      if (domainNotExisted) {
        throw new InvalidRequestException("Spec and Domain do not match");
      }
    }

    // Upload credential files to S3
    List<String> credentialFileUrls = fileStorageService.uploadFiles(
        credentialFiles,
        "reviewer-credentials"
    );
    log.info("Uploaded {} credential files to S3", credentialFileUrls.size());

    // Map request to User entity
    User user = authMapper.toUserEntity(request);
    user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
    user.setRole(UserRole.REVIEWER);
    user.setStatus(UserStatus.PENDING_EMAIL_VERIFY);

    user = userRepository.save(user);
    log.info("Created reviewer user with id: {} - pending email verification", user.getId());

    // Map request to ReviewerProfile and set user & credentials
    ReviewerProfile reviewerProfile = authMapper.toReviewerProfile(request);
    reviewerProfile.setUser(user);
    reviewerProfile.setCredentialFileUrls(credentialFileUrls);

    reviewerProfile = reviewerProfileRepository.save(reviewerProfile);
    log.info("Created reviewer profile for user id: {}", user.getId());

    // Create domain links
    for (Domain domain : domains) {
      ReviewerDomainLink link = ReviewerDomainLink.builder()
          .reviewer(reviewerProfile)
          .domain(domain)
          .build();
      reviewerDomainLinkRepository.save(link);
    }
    log.info("Created {} domain links for reviewer", domains.size());

    // Create specialization links
    for (Specialization specialization : specializations) {
      ReviewerSpecLink link = ReviewerSpecLink.builder()
          .reviewer(reviewerProfile)
          .specialization(specialization)
          .build();
      reviewerSpecLinkRepository.save(link);
    }
    log.info("Created {} specialization links for reviewer", specializations.size());

    // Generate email verification token (expires in 10 minutes)
    String verificationToken = jwtUtil.generateEmailVerificationToken(
        user.getId(),
        user.getEmail()
    );

    // Send verification email (async)
    emailService.sendEmailVerification(user.getId(), user.getEmail(), verificationToken);

    // Notify BUSINESS_ADMIN about new reviewer registration
    notificationHelper.sendNotificationToBusinessAdmins(
        com.capstone.be.domain.enums.NotificationType.INFO,
        "New Reviewer Registration",
        String.format("A new REVIEWER has registered: %s (%s)", user.getFullName(), user.getEmail())
    );

    // Return response WITHOUT access token (user needs to verify email first)
    return authMapper.toAuthResponse(user);
  }

  @Override
  @Transactional
  public void resendVerificationEmail(String email) {
    // Normalize email to lowercase
    String normalizedEmail = email.toLowerCase().trim();
    
    // Find user by email
    User user = userRepository.findByEmail(normalizedEmail)
        .orElseThrow(() -> ResourceNotFoundException.userByEmail(normalizedEmail));

    // Check if user is in PENDING_EMAIL_VERIFY status
    if (user.getStatus() != UserStatus.PENDING_EMAIL_VERIFY) {
      if (user.getStatus() == UserStatus.ACTIVE) {
        throw new InvalidRequestException("Email already verified");
      } else if (user.getStatus() == UserStatus.PENDING_APPROVE) {
        throw new InvalidRequestException("Email already verified, waiting for admin approval");
      } else {
        throw new InvalidRequestException("Account status does not require email verification");
      }
    }

    // Generate new email verification token
    String verificationToken = jwtUtil.generateEmailVerificationToken(
        user.getId(),
        user.getEmail()
    );

    // Send verification email (async)
    emailService.sendEmailVerification(user.getId(), user.getEmail(), verificationToken);

    log.info("Resent verification email to: {}", email);
  }
}
