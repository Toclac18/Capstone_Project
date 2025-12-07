package com.capstone.be.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.capstone.be.config.constant.FileStorage;
import com.capstone.be.domain.entity.OrgEnrollment;
import com.capstone.be.domain.entity.OrganizationProfile;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.OrgEnrollStatus;
import com.capstone.be.dto.request.organization.UpdateOrganizationProfileRequest;
import com.capstone.be.dto.response.organization.OrganizationProfileResponse;
import com.capstone.be.dto.response.organization.PublicOrganizationResponse;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.mapper.OrganizationMapper;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.OrgEnrollmentRepository;
import com.capstone.be.repository.OrganizationProfileRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.service.FileStorageService;
import com.capstone.be.service.impl.OrganizationServiceImpl;
import java.time.Instant;
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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

@ExtendWith(MockitoExtension.class)
@DisplayName("OrganizationService Unit Tests")
class OrganizationServiceTest {

  @Mock
  private UserRepository userRepository;

  @Mock
  private OrganizationProfileRepository organizationProfileRepository;

  @Mock
  private FileStorageService fileStorageService;

  @Mock
  private OrgEnrollmentRepository orgEnrollmentRepository;

  @Mock
  private OrganizationMapper organizationMapper;

  @Mock
  private DocumentRepository documentRepository;

  @InjectMocks
  private OrganizationServiceImpl organizationService;

  private User user;
  private OrganizationProfile organizationProfile;
  private UUID userId;
  private UUID organizationId;
  private UUID readerId;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();
    organizationId = UUID.randomUUID();
    readerId = UUID.randomUUID();

    user = User.builder()
        .id(userId)
        .email("org@example.com")
        .fullName("Organization Admin")
        .build();

    organizationProfile = OrganizationProfile.builder()
        .id(organizationId)
        .admin(user)
        .name("Test Organization")
        .email("org@example.com")
        .logoKey("old-logo-key")
        .createdAt(Instant.now())
        .updatedAt(Instant.now())
        .build();
  }

  // test getProfile should return organization profile
  @Test
  @DisplayName("getProfile should return organization profile")
  void getProfile_ShouldReturnProfile() {
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(organizationProfileRepository.findByUserId(userId))
        .thenReturn(Optional.of(organizationProfile));

    OrganizationProfileResponse result = organizationService.getProfile(userId);

    assertNotNull(result);
    assertEquals("Test Organization", result.getOrgName());
    verify(organizationProfileRepository, times(1)).findByUserId(userId);
  }

  // test getProfile should throw exception when user not found
  @Test
  @DisplayName("getProfile should throw exception when user not found")
  void getProfile_ShouldThrowException_WhenUserNotFound() {
    when(userRepository.findById(userId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> organizationService.getProfile(userId));
    verify(organizationProfileRepository, never()).findByUserId(any());
  }

  // test getProfile should throw exception when profile not found
  @Test
  @DisplayName("getProfile should throw exception when profile not found")
  void getProfile_ShouldThrowException_WhenProfileNotFound() {
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(organizationProfileRepository.findByUserId(userId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> organizationService.getProfile(userId));
  }

  // test updateProfile should update profile successfully
  @Test
  @DisplayName("updateProfile should update profile successfully")
  void updateProfile_ShouldUpdateProfile() {
    UpdateOrganizationProfileRequest request = UpdateOrganizationProfileRequest.builder()
        .fullName("Updated Name")
        .name("Updated Organization")
        .email("updated@example.com")
        .build();

    User updatedUser = User.builder()
        .id(userId)
        .fullName("Updated Name")
        .build();

    OrganizationProfile updatedProfile = OrganizationProfile.builder()
        .id(organizationId)
        .admin(updatedUser)
        .name("Updated Organization")
        .email("updated@example.com")
        .build();

    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(organizationProfileRepository.findByUserId(userId))
        .thenReturn(Optional.of(organizationProfile));
    when(userRepository.save(any(User.class))).thenReturn(updatedUser);
    when(organizationProfileRepository.save(any(OrganizationProfile.class)))
        .thenReturn(updatedProfile);

    OrganizationProfileResponse result = organizationService.updateProfile(userId, request);

    assertEquals("Updated Organization", result.getOrgName());
    verify(userRepository, times(1)).save(any(User.class));
    verify(organizationProfileRepository, times(1)).save(any(OrganizationProfile.class));
  }

  // test updateProfile should update only provided fields
  @Test
  @DisplayName("updateProfile should update only provided fields")
  void updateProfile_ShouldUpdateOnlyProvidedFields() {
    UpdateOrganizationProfileRequest request = UpdateOrganizationProfileRequest.builder()
        .name("Updated Organization")
        .build();

    OrganizationProfile updatedProfile = OrganizationProfile.builder()
        .id(organizationId)
        .admin(user)
        .name("Updated Organization")
        .email("org@example.com")
        .build();

    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(organizationProfileRepository.findByUserId(userId))
        .thenReturn(Optional.of(organizationProfile));
    when(organizationProfileRepository.save(any(OrganizationProfile.class)))
        .thenReturn(updatedProfile);

    OrganizationProfileResponse result = organizationService.updateProfile(userId, request);

    assertEquals("Updated Organization", result.getOrgName());
    verify(userRepository, times(1)).save(any());
  }

  // test uploadLogo should upload logo successfully
  @Test
  @DisplayName("uploadLogo should upload logo successfully")
  void uploadLogo_ShouldUploadLogo() {
    MultipartFile file = new MockMultipartFile("logo", "logo.png", "image/png", "content".getBytes());
    String newLogoKey = "new-logo-key";

    OrganizationProfile updatedProfile = OrganizationProfile.builder()
        .id(organizationId)
        .admin(user)
        .name("Test Organization")
        .logoKey(newLogoKey)
        .build();

    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(organizationProfileRepository.findByUserId(userId))
        .thenReturn(Optional.of(organizationProfile));
    when(fileStorageService.uploadFile(file, FileStorage.ORG_LOGO_FOLDER, null))
        .thenReturn(newLogoKey);
    when(organizationProfileRepository.save(any(OrganizationProfile.class)))
        .thenReturn(updatedProfile);

    OrganizationProfileResponse result = organizationService.uploadLogo(userId, file);

    assertNotNull(result);
    verify(fileStorageService, times(1)).deleteFile(FileStorage.ORG_LOGO_FOLDER, "old-logo-key");
    verify(fileStorageService, times(1)).uploadFile(file, FileStorage.ORG_LOGO_FOLDER, null);
  }

  // test uploadLogo should handle missing old logo gracefully
  @Test
  @DisplayName("uploadLogo should handle missing old logo gracefully")
  void uploadLogo_ShouldHandleMissingOldLogo() {
    MultipartFile file = new MockMultipartFile("logo", "logo.png", "image/png", "content".getBytes());
    String newLogoKey = "new-logo-key";

    OrganizationProfile profileWithoutLogo = OrganizationProfile.builder()
        .id(organizationId)
        .admin(user)
        .name("Test Organization")
        .logoKey(null)
        .build();

    OrganizationProfile updatedProfile = OrganizationProfile.builder()
        .id(organizationId)
        .admin(user)
        .name("Test Organization")
        .logoKey(newLogoKey)
        .build();

    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(organizationProfileRepository.findByUserId(userId))
        .thenReturn(Optional.of(profileWithoutLogo));
    when(fileStorageService.uploadFile(file, FileStorage.ORG_LOGO_FOLDER, null))
        .thenReturn(newLogoKey);
    when(organizationProfileRepository.save(any(OrganizationProfile.class)))
        .thenReturn(updatedProfile);

    OrganizationProfileResponse result = organizationService.uploadLogo(userId, file);

    assertNotNull(result);
    verify(fileStorageService, never()).deleteFile(any(), any());
  }

  // test getPublicOrganizationInfo should return public info
  @Test
  @DisplayName("getPublicOrganizationInfo should return public info")
  void getPublicOrganizationInfo_ShouldReturnPublicInfo() {
    User reader = User.builder().id(readerId).build();
    OrgEnrollment enrollment = OrgEnrollment.builder()
        .id(UUID.randomUUID())
        .organization(organizationProfile)
        .member(reader)
        .status(OrgEnrollStatus.JOINED)
        .build();

    PublicOrganizationResponse response = PublicOrganizationResponse.builder()
        .id(organizationId)
        .name("Test Organization")
        .memberCount(10L)
        .documentCount(5L)
        .build();

    when(userRepository.findById(readerId)).thenReturn(Optional.of(reader));
    when(organizationProfileRepository.findById(organizationId))
        .thenReturn(Optional.of(organizationProfile));
    when(orgEnrollmentRepository.findByOrganizationAndMember(organizationProfile, reader))
        .thenReturn(Optional.of(enrollment));
    when(orgEnrollmentRepository.countByOrganizationAndStatus(organizationProfile, OrgEnrollStatus.JOINED))
        .thenReturn(10L);
    when(documentRepository.countByOrganizationId(organizationId)).thenReturn(5L);
    when(organizationMapper.toPublicResponse(organizationProfile)).thenReturn(response);

    PublicOrganizationResponse result =
        organizationService.getPublicOrganizationInfo(readerId, organizationId);

    assertNotNull(result);
    assertEquals("Test Organization", result.getName());
  }

  // test getPublicOrganizationInfo should throw exception when not enrolled
  @Test
  @DisplayName("getPublicOrganizationInfo should throw exception when not enrolled")
  void getPublicOrganizationInfo_ShouldThrowException_WhenNotEnrolled() {
    User reader = User.builder().id(readerId).build();
    when(userRepository.findById(readerId)).thenReturn(Optional.of(reader));
    when(organizationProfileRepository.findById(organizationId))
        .thenReturn(Optional.of(organizationProfile));
    when(orgEnrollmentRepository.findByOrganizationAndMember(organizationProfile, reader))
        .thenReturn(Optional.empty());

    assertThrows(Exception.class,
        () -> organizationService.getPublicOrganizationInfo(readerId, organizationId));
  }

  // test getJoinedOrganizations should return paginated organizations
  @Test
  @DisplayName("getJoinedOrganizations should return paginated organizations")
  void getJoinedOrganizations_ShouldReturnPaginatedOrganizations() {
    Pageable pageable = PageRequest.of(0, 10);
    User reader = User.builder().id(readerId).build();
    OrgEnrollment enrollment = OrgEnrollment.builder()
        .id(UUID.randomUUID())
        .member(reader)
        .organization(organizationProfile)
        .status(OrgEnrollStatus.JOINED)
        .build();

    Page<OrgEnrollment> enrollmentPage = new PageImpl<>(Arrays.asList(enrollment), pageable, 1);

    PublicOrganizationResponse response = PublicOrganizationResponse.builder()
        .id(organizationId)
        .name("Test Organization")
        .memberCount(10L)
        .documentCount(5L)
        .build();

    when(userRepository.findById(readerId)).thenReturn(Optional.of(reader));
    when(orgEnrollmentRepository.findByMemberAndStatus(reader, OrgEnrollStatus.JOINED, pageable))
        .thenReturn(enrollmentPage);
    when(orgEnrollmentRepository.countByOrganizationAndStatus(organizationProfile, OrgEnrollStatus.JOINED))
        .thenReturn(10L);
    when(documentRepository.countByOrganizationId(organizationId)).thenReturn(5L);
    when(organizationMapper.toPublicResponse(organizationProfile)).thenReturn(response);

    Page<PublicOrganizationResponse> result =
        organizationService.getJoinedOrganizations(readerId, null, pageable);

    assertNotNull(result);
    assertEquals(1, result.getTotalElements());
  }
}

