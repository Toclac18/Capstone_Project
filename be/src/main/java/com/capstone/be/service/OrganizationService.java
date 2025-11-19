package com.capstone.be.service;

import com.capstone.be.dto.request.organization.UpdateOrganizationProfileRequest;
import com.capstone.be.dto.response.organization.OrganizationProfileResponse;
import java.util.UUID;
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
}
