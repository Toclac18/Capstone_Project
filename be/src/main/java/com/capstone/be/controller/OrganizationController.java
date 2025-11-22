package com.capstone.be.controller;

import com.capstone.be.dto.request.organization.UpdateOrganizationProfileRequest;
import com.capstone.be.dto.response.organization.OrganizationProfileResponse;
import com.capstone.be.security.model.UserPrincipal;
import com.capstone.be.service.OrganizationService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
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
  public ResponseEntity<OrganizationProfileResponse> getProfile(
      @AuthenticationPrincipal UserPrincipal userPrincipal) {
    UUID userId = userPrincipal.getId();
    log.info("Get profile request for organization user ID: {}", userId);

    OrganizationProfileResponse response = organizationService.getProfile(userId);

    return ResponseEntity.ok(response);
  }

  /**
   * Update organization profile
   * PUT /api/v1/organization/profile
   *
   * @param request        Update profile request
   * @return Updated OrganizationProfileResponse
   */
  @PutMapping("/profile")
  @PreAuthorize("hasRole('ORGANIZATION_ADMIN')")
  public ResponseEntity<OrganizationProfileResponse> updateProfile(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @Valid @RequestBody UpdateOrganizationProfileRequest request) {
    UUID userId = userPrincipal.getId();
    log.info("Update profile request for organization user ID: {}", userId);

    OrganizationProfileResponse response = organizationService.updateProfile(userId, request);

    return ResponseEntity.ok(response);
  }

  /**
   * Upload logo for organization
   * POST /api/v1/organization/profile/logo
   *
   * @param file           Logo image file
   * @return Updated OrganizationProfileResponse with new logo URL
   */
  @PostMapping("/profile/logo")
  @PreAuthorize("hasRole('ORGANIZATION_ADMIN')")
  public ResponseEntity<OrganizationProfileResponse> uploadLogo(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @RequestParam(name = "file") MultipartFile file) {
    UUID userId = userPrincipal.getId();
    log.info("Upload logo request for organization user ID: {}", userId);

    OrganizationProfileResponse response = organizationService.uploadLogo(userId, file);

    return ResponseEntity.ok(response);
  }
}
