package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.OrgEnrollment;
import com.capstone.be.domain.entity.OrganizationProfile;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.OrgEnrollStatus;
import com.capstone.be.dto.request.organization.UpdateOrganizationProfileRequest;
import com.capstone.be.dto.response.organization.OrganizationProfileResponse;
import com.capstone.be.dto.response.organization.PublicOrganizationResponse;
import com.capstone.be.exception.BusinessException;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.mapper.OrganizationMapper;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.OrgEnrollmentRepository;
import com.capstone.be.repository.OrganizationProfileRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.service.FileStorageService;
import com.capstone.be.service.OrganizationService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrganizationServiceImpl implements OrganizationService {

  private final UserRepository userRepository;
  private final OrganizationProfileRepository organizationProfileRepository;
  private final FileStorageService fileStorageService;
  private final OrgEnrollmentRepository orgEnrollmentRepository;
  private final OrganizationMapper organizationMapper;
  private final DocumentRepository documentRepository;

  @Override
  @Transactional(readOnly = true)
  public OrganizationProfileResponse getProfile(UUID userId) {
    log.info("Getting organization profile for user ID: {}", userId);

    // Get user
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

    // Get organization profile
    OrganizationProfile organizationProfile = organizationProfileRepository.findByUserId(userId)
        .orElseThrow(() -> new ResourceNotFoundException(
            "Organization profile not found for user ID: " + userId));

    // Build response
    return buildProfileResponse(user, organizationProfile);
  }

  @Override
  @Transactional
  public OrganizationProfileResponse updateProfile(UUID userId,
      UpdateOrganizationProfileRequest request) {
    log.info("Updating organization profile for user ID: {}", userId);

    // Get user
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

    // Get organization profile
    OrganizationProfile organizationProfile = organizationProfileRepository.findByUserId(userId)
        .orElseThrow(() -> new ResourceNotFoundException(
            "Organization profile not found for user ID: " + userId));

    // Update user fields (only if provided)
    if (request.getFullName() != null) {
      user.setFullName(request.getFullName());
    }

    // Update organization profile fields (only if provided)
    if (request.getName() != null) {
      organizationProfile.setName(request.getName());
    }
    if (request.getType() != null) {
      organizationProfile.setType(request.getType());
    }
    if (request.getEmail() != null) {
      organizationProfile.setEmail(request.getEmail());
    }
    if (request.getHotline() != null) {
      organizationProfile.setHotline(request.getHotline());
    }
    if (request.getAddress() != null) {
      organizationProfile.setAddress(request.getAddress());
    }
    if (request.getRegistrationNumber() != null) {
      organizationProfile.setRegistrationNumber(request.getRegistrationNumber());
    }

    // Save changes
    userRepository.save(user);
    organizationProfileRepository.save(organizationProfile);

    log.info("Successfully updated profile for user ID: {}", userId);

    // Return updated profile
    return buildProfileResponse(user, organizationProfile);
  }

  @Override
  @Transactional
  public OrganizationProfileResponse uploadAvatar(UUID userId, MultipartFile file) {
    log.info("Uploading avatar for organization admin user ID: {}", userId);

    // Get user
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

    // Get organization profile
    OrganizationProfile organizationProfile = organizationProfileRepository.findByUserId(userId)
        .orElseThrow(() -> new ResourceNotFoundException(
            "Organization profile not found for user ID: " + userId));

    // Delete old avatar if exists
    if (user.getAvatarUrl() != null && !user.getAvatarUrl().isEmpty()) {
      try {
        fileStorageService.deleteFile(user.getAvatarUrl());
        log.info("Deleted old avatar for user ID: {}", userId);
      } catch (Exception e) {
        log.warn("Failed to delete old avatar, continuing with upload: {}", e.getMessage());
      }
    }

    // Upload new avatar to S3
    String avatarUrl = fileStorageService.uploadFile(file, "avatars", null);
    user.setAvatarUrl(avatarUrl);

    // Save user
    userRepository.save(user);

    log.info("Successfully uploaded avatar for user ID: {}", userId);

    // Return updated profile
    return buildProfileResponse(user, organizationProfile);
  }

  @Override
  @Transactional
  public OrganizationProfileResponse uploadLogo(UUID userId, MultipartFile file) {
    log.info("Uploading logo for organization user ID: {}", userId);

    // Get user
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

    // Get organization profile
    OrganizationProfile organizationProfile = organizationProfileRepository.findByUserId(userId)
        .orElseThrow(() -> new ResourceNotFoundException(
            "Organization profile not found for user ID: " + userId));

    // Delete old logo if exists
    if (organizationProfile.getLogo() != null && !organizationProfile.getLogo().isEmpty()) {
      try {
        fileStorageService.deleteFile(organizationProfile.getLogo());
        log.info("Deleted old logo for organization user ID: {}", userId);
      } catch (Exception e) {
        log.warn("Failed to delete old logo, continuing with upload: {}", e.getMessage());
      }
    }

    // Upload new logo to S3
    String logoUrl = fileStorageService.uploadFile(file, "logos", null);
    organizationProfile.setLogo(logoUrl);

    // Save organization profile
    organizationProfileRepository.save(organizationProfile);

    log.info("Successfully uploaded logo for organization user ID: {}", userId);

    // Return updated profile
    return buildProfileResponse(user, organizationProfile);
  }

  /**
   * Helper method to build profile response
   */
  private OrganizationProfileResponse buildProfileResponse(User user,
      OrganizationProfile organizationProfile) {
    return OrganizationProfileResponse.builder()
        .userId(user.getId())
        .email(user.getEmail())
        .fullName(user.getFullName())
        .avatarUrl(user.getAvatarUrl())
        .point(user.getPoint())
        .status(user.getStatus())
        .orgName(organizationProfile.getName())
        .orgType(organizationProfile.getType())
        .orgEmail(organizationProfile.getEmail())
        .orgHotline(organizationProfile.getHotline())
        .orgLogo(organizationProfile.getLogo())
        .orgAddress(organizationProfile.getAddress())
        .orgRegistrationNumber(organizationProfile.getRegistrationNumber())
        .createdAt(organizationProfile.getCreatedAt())
        .updatedAt(organizationProfile.getUpdatedAt())
        .build();
  }

  @Override
  @Transactional(readOnly = true)
  public PublicOrganizationResponse getPublicOrganizationInfo(UUID readerId, UUID organizationId) {
    log.info("Getting public organization info for ID: {} by reader: {}", organizationId, readerId);

    User reader = userRepository.findById(readerId)
        .orElseThrow(() -> ResourceNotFoundException.userById(readerId));

    OrganizationProfile organization = organizationProfileRepository.findById(organizationId)
        .orElseThrow(() -> new ResourceNotFoundException(
            "Organization", "id", organizationId));

    // Check if reader is a JOINED member of the organization
    boolean isMember = orgEnrollmentRepository.findByOrganizationAndMember(organization, reader)
        .map(enrollment -> enrollment.getStatus() == OrgEnrollStatus.JOINED)
        .orElse(false);

    if (!isMember) {
      throw new BusinessException(
          "You must be a member of this organization to view its details",
          HttpStatus.FORBIDDEN,
          "NOT_MEMBER"
      );
    }

    PublicOrganizationResponse response = organizationMapper.toPublicResponse(organization);

    // Get member count (only JOINED members)
    long memberCount = orgEnrollmentRepository.countByOrganizationAndStatus(
        organization, OrgEnrollStatus.JOINED);
    response.setMemberCount(memberCount);

    // Get document count
    long documentCount = documentRepository.countByOrganizationId(organization.getId());
    response.setDocumentCount(documentCount);

    return response;
  }

  @Override
  @Transactional(readOnly = true)
  public Page<PublicOrganizationResponse> getJoinedOrganizations(
      UUID readerId,
      String search,
      Pageable pageable) {
    log.info("Getting joined organizations for reader: {}, search: {}", readerId, search);

    User reader = userRepository.findById(readerId)
        .orElseThrow(() -> ResourceNotFoundException.userById(readerId));

    // Get all JOINED enrollments for the reader
    Page<OrgEnrollment> enrollments = orgEnrollmentRepository.findByMemberAndStatus(
        reader, OrgEnrollStatus.JOINED, pageable);

    // Map enrollments to responses
    return enrollments.map(enrollment -> {
      OrganizationProfile org = enrollment.getOrganization();

      // Apply search filter
      if (search != null && !search.trim().isEmpty()) {
        String lowerSearch = search.toLowerCase();
        if (!org.getName().toLowerCase().contains(lowerSearch)) {
          return null; // Will be filtered out later
        }
      }

      PublicOrganizationResponse response = organizationMapper.toPublicResponse(org);

      // Get member count (only JOINED members)
      long memberCount = orgEnrollmentRepository.countByOrganizationAndStatus(
          org, OrgEnrollStatus.JOINED);
      response.setMemberCount(memberCount);

      // Get document count
      long documentCount = documentRepository.countByOrganizationId(org.getId());
      response.setDocumentCount(documentCount);

      return response;
    });
  }
}
