package com.capstone.be.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.capstone.be.domain.entity.OrganizationProfile;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.UserStatus;
import com.capstone.be.dto.request.organization.ApproveOrganizationRequest;
import com.capstone.be.dto.response.organization.PendingOrganizationResponse;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.repository.OrganizationProfileRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.service.EmailService;
import com.capstone.be.service.impl.OrganizationApprovalServiceImpl;
import java.util.Arrays;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@ExtendWith(MockitoExtension.class)
@DisplayName("OrganizationApprovalService Unit Tests")
class OrganizationApprovalServiceTest {

  @Mock
  private UserRepository userRepository;

  @Mock
  private OrganizationProfileRepository organizationProfileRepository;

  @Mock
  private EmailService emailService;

  @Mock
  private com.capstone.be.mapper.OrganizationApprovalMapper organizationApprovalMapper;

  @InjectMocks
  private OrganizationApprovalServiceImpl organizationApprovalService;

  private User orgAdmin;
  private OrganizationProfile organizationProfile;
  private UUID adminUserId;

  @BeforeEach
  void setUp() {
    adminUserId = UUID.randomUUID();

    orgAdmin = User.builder()
        .id(adminUserId)
        .email("org@example.com")
        .fullName("Org Admin")
        .status(UserStatus.PENDING_APPROVE)
        .role(com.capstone.be.domain.enums.UserRole.ORGANIZATION_ADMIN)
        .build();

    organizationProfile = OrganizationProfile.builder()
        .id(UUID.randomUUID())
        .admin(orgAdmin)
        .name("Test Organization")
        .build();
  }

  // test getPendingOrganizations should return paginated pending organizations
  @Test
  @DisplayName("getPendingOrganizations should return paginated pending organizations")
  void getPendingOrganizations_ShouldReturnPaginatedOrganizations() {
    Pageable pageable = PageRequest.of(0, 10);
    orgAdmin.setRole(com.capstone.be.domain.enums.UserRole.ORGANIZATION_ADMIN);
    orgAdmin.setStatus(UserStatus.PENDING_APPROVE);
    Page<User> userPage = new PageImpl<>(Arrays.asList(orgAdmin), pageable, 1);

    when(userRepository.findByRoleAndStatus(
        com.capstone.be.domain.enums.UserRole.ORGANIZATION_ADMIN, UserStatus.PENDING_APPROVE, pageable))
        .thenReturn(userPage);
    when(organizationProfileRepository.findByAdminId(adminUserId))
        .thenReturn(Optional.of(organizationProfile));
    when(organizationApprovalMapper.toPendingOrganizationResponse(any(User.class), any(OrganizationProfile.class)))
        .thenReturn(PendingOrganizationResponse.builder()
            .adminUserId(adminUserId)
            .build());

    Page<PendingOrganizationResponse> result = organizationApprovalService.getPendingOrganizations(pageable);

    assertEquals(1, result.getTotalElements());
    verify(userRepository, times(1)).findByRoleAndStatus(
        com.capstone.be.domain.enums.UserRole.ORGANIZATION_ADMIN, UserStatus.PENDING_APPROVE, pageable);
  }

  // test getPendingOrganizationById should return organization
  @Test
  @DisplayName("getPendingOrganizationById should return organization")
  void getPendingOrganizationById_ShouldReturnOrganization() {
    orgAdmin.setRole(com.capstone.be.domain.enums.UserRole.ORGANIZATION_ADMIN);
    orgAdmin.setStatus(UserStatus.PENDING_APPROVE);
    when(userRepository.findById(adminUserId)).thenReturn(Optional.of(orgAdmin));
    when(organizationProfileRepository.findByAdminId(adminUserId))
        .thenReturn(Optional.of(organizationProfile));
    when(organizationApprovalMapper.toPendingOrganizationResponse(any(User.class), any(OrganizationProfile.class)))
        .thenReturn(PendingOrganizationResponse.builder()
            .adminUserId(adminUserId)
            .build());

    PendingOrganizationResponse result = organizationApprovalService.getPendingOrganizationById(adminUserId);

    assertNotNull(result);
    assertEquals(adminUserId, result.getAdminUserId());
    verify(userRepository, times(1)).findById(adminUserId);
  }

  // test getPendingOrganizationById should throw exception when not found
  @Test
  @DisplayName("getPendingOrganizationById should throw exception when not found")
  void getPendingOrganizationById_ShouldThrowException_WhenNotFound() {
    UUID nonExistentId = UUID.randomUUID();
    when(userRepository.findById(nonExistentId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> organizationApprovalService.getPendingOrganizationById(nonExistentId));
  }

  // test approveOrRejectOrganization should approve organization
  @Test
  @DisplayName("approveOrRejectOrganization should approve organization")
  void approveOrRejectOrganization_ShouldApproveOrganization() {
    ApproveOrganizationRequest request = ApproveOrganizationRequest.builder()
        .userId(adminUserId)
        .approved(true)
        .build();

    when(userRepository.findById(adminUserId)).thenReturn(Optional.of(orgAdmin));
    when(userRepository.save(any(User.class))).thenReturn(orgAdmin);

    organizationApprovalService.approveOrRejectOrganization(request);

    assertEquals(UserStatus.ACTIVE, orgAdmin.getStatus());
    verify(userRepository, times(1)).save(any(User.class));
    verify(emailService, times(1)).sendWelcomeEmail(orgAdmin.getEmail(), orgAdmin.getFullName());
  }

  // test approveOrRejectOrganization should reject organization
  @Test
  @DisplayName("approveOrRejectOrganization should reject organization")
  void approveOrRejectOrganization_ShouldRejectOrganization() {
    String rejectionReason = "Invalid registration";
    ApproveOrganizationRequest request = ApproveOrganizationRequest.builder()
        .userId(adminUserId)
        .approved(false)
        .rejectionReason(rejectionReason)
        .build();

    when(userRepository.findById(adminUserId)).thenReturn(Optional.of(orgAdmin));
    when(userRepository.save(any(User.class))).thenReturn(orgAdmin);

    organizationApprovalService.approveOrRejectOrganization(request);

    assertEquals(UserStatus.REJECTED, orgAdmin.getStatus());
    verify(userRepository, times(1)).save(any(User.class));
    verify(emailService, times(1))
        .sendOrganizationRejectionEmail(orgAdmin.getEmail(), orgAdmin.getFullName(), rejectionReason);
  }
}

