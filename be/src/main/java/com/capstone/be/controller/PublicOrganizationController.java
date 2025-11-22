package com.capstone.be.controller;

import com.capstone.be.dto.common.PagedResponse;
import com.capstone.be.dto.response.organization.PublicOrganizationResponse;
import com.capstone.be.security.model.UserPrincipal;
import com.capstone.be.service.OrganizationService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public controller for organization information
 * Accessible by authenticated users (readers and organization admins)
 * Shows only organizations that the user has joined
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/public/organizations")
@RequiredArgsConstructor
public class PublicOrganizationController {

  private final OrganizationService organizationService;

  /**
   * Get all joined organizations for the authenticated user
   * GET /api/v1/public/organizations
   *
   * @param userPrincipal Authenticated user
   * @param search        Search by name (optional)
   * @param pageable      Pagination parameters
   * @return Paged response of joined organizations
   */
  @GetMapping
  @PreAuthorize("hasAnyRole('READER', 'ORGANIZATION_ADMIN')")
  public ResponseEntity<PagedResponse<PublicOrganizationResponse>> getJoinedOrganizations(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @RequestParam(name = "search", required = false) String search,
      Pageable pageable) {
    UUID readerId = userPrincipal.getId();
    log.info("Get joined organizations for user: {}, search: {}", readerId, search);

    Page<PublicOrganizationResponse> organizations = organizationService
        .getJoinedOrganizations(readerId, search, pageable);

    return ResponseEntity.ok(PagedResponse.of(organizations));
  }

  /**
   * Get public information of an organization (only if user is a member)
   * GET /api/v1/public/organizations/{organizationId}
   *
   * @param userPrincipal  Authenticated user
   * @param organizationId Organization ID
   * @return Public organization information
   */
  @GetMapping("/{organizationId}")
  @PreAuthorize("hasAnyRole('READER', 'ORGANIZATION_ADMIN')")
  public ResponseEntity<PublicOrganizationResponse> getOrganizationInfo(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @PathVariable(name = "organizationId") UUID organizationId) {
    UUID readerId = userPrincipal.getId();
    log.info("Get organization info for ID: {} by user: {}", organizationId, readerId);

    PublicOrganizationResponse organization = organizationService
        .getPublicOrganizationInfo(readerId, organizationId);

    return ResponseEntity.ok(organization);
  }
}
