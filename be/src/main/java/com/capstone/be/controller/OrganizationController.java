package com.capstone.be.controller;

import com.capstone.be.dto.request.organization.UpdateOrganizationProfileRequest;
import com.capstone.be.dto.response.organization.OrganizationProfileResponse;
import com.capstone.be.service.OrganizationService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Controller for Organization-specific operations
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/organization")
@RequiredArgsConstructor
public class OrganizationController {

  private final OrganizationService organizationService;

  /**
   * Get organization profile
   * GET /api/v1/organization/profile
   *
   * @param authentication Spring Security authentication
   * @return OrganizationProfileResponse
   */
  @GetMapping("/profile")
  @PreAuthorize("hasRole('ORGANIZATION_ADMIN')")
  public ResponseEntity<OrganizationProfileResponse> getProfile(Authentication authentication) {
    UUID userId = UUID.fromString(authentication.getName());
    log.info("Get profile request for organization user ID: {}", userId);

    OrganizationProfileResponse response = organizationService.getProfile(userId);

    return ResponseEntity.ok(response);
  }

  /**
   * Update organization profile
   * PUT /api/v1/organization/profile
   *
   * @param authentication Spring Security authentication
   * @param request        Update profile request
   * @return Updated OrganizationProfileResponse
   */
  @PutMapping("/profile")
  @PreAuthorize("hasRole('ORGANIZATION_ADMIN')")
  public ResponseEntity<OrganizationProfileResponse> updateProfile(
      Authentication authentication,
      @Valid @RequestBody UpdateOrganizationProfileRequest request) {
    UUID userId = UUID.fromString(authentication.getName());
    log.info("Update profile request for organization user ID: {}", userId);

    OrganizationProfileResponse response = organizationService.updateProfile(userId, request);

    return ResponseEntity.ok(response);
  }

  /**
   * Upload avatar for organization admin
   * POST /api/v1/organization/profile/avatar
   *
   * @param authentication Spring Security authentication
   * @param file           Avatar image file
   * @return Updated OrganizationProfileResponse with new avatar URL
   */
  @PostMapping("/profile/avatar")
  @PreAuthorize("hasRole('ORGANIZATION_ADMIN')")
  public ResponseEntity<OrganizationProfileResponse> uploadAvatar(
      Authentication authentication,
      @RequestParam(name = "file") MultipartFile file) {
    UUID userId = UUID.fromString(authentication.getName());
    log.info("Upload avatar request for organization user ID: {}", userId);

    OrganizationProfileResponse response = organizationService.uploadAvatar(userId, file);

    return ResponseEntity.ok(response);
  }

  /**
   * Upload logo for organization
   * POST /api/v1/organization/profile/logo
   *
   * @param authentication Spring Security authentication
   * @param file           Logo image file
   * @return Updated OrganizationProfileResponse with new logo URL
   */
  @PostMapping("/profile/logo")
  @PreAuthorize("hasRole('ORGANIZATION_ADMIN')")
  public ResponseEntity<OrganizationProfileResponse> uploadLogo(
      Authentication authentication,
      @RequestParam(name = "file") MultipartFile file) {
    UUID userId = UUID.fromString(authentication.getName());
    log.info("Upload logo request for organization user ID: {}", userId);

    OrganizationProfileResponse response = organizationService.uploadLogo(userId, file);

    return ResponseEntity.ok(response);
  }
}
