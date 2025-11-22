package com.capstone.be.service;

import com.capstone.be.dto.request.organization.UpdateOrganizationProfileRequest;
import com.capstone.be.dto.response.organization.OrganizationProfileResponse;
import com.capstone.be.dto.response.organization.PublicOrganizationResponse;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

public interface OrganizationService {

  /**
   * Get organization profile by user ID
   *
   * @param userId User ID
   * @return OrganizationProfileResponse
   */
  OrganizationProfileResponse getProfile(UUID userId);

  /**
   * Update organization profile
   *
   * @param userId  User ID
   * @param request Update profile request
   * @return Updated OrganizationProfileResponse
   */
  OrganizationProfileResponse updateProfile(UUID userId, UpdateOrganizationProfileRequest request);

  /**
   * Upload avatar for organization admin
   *
   * @param userId User ID
   * @param file   Avatar image file
   * @return Updated OrganizationProfileResponse with new avatar URL
   */
  OrganizationProfileResponse uploadAvatar(UUID userId, MultipartFile file);

  /**
   * Upload logo for organization
   *
   * @param userId User ID
   * @param file   Logo image file
   * @return Updated OrganizationProfileResponse with new logo URL
   */
  OrganizationProfileResponse uploadLogo(UUID userId, MultipartFile file);

  /**
   * Get public information of an organization (reader must be a member)
   *
   * @param readerId       Reader user ID
   * @param organizationId Organization ID
   * @return Public organization information
   */
  PublicOrganizationResponse getPublicOrganizationInfo(UUID readerId, UUID organizationId);

  /**
   * Get all joined organizations for a reader
   *
   * @param readerId Reader user ID
   * @param search   Search by name (optional)
   * @param pageable Pagination parameters
   * @return Page of joined organizations
   */
  Page<PublicOrganizationResponse> getJoinedOrganizations(
      UUID readerId,
      String search,
      Pageable pageable
  );
}
