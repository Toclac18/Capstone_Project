package com.capstone.be.controller;

import com.capstone.be.domain.enums.UserStatus;
import com.capstone.be.dto.request.admin.UpdateUserStatusRequest;
import com.capstone.be.dto.response.admin.AdminOrganizationResponse;
import com.capstone.be.service.UserService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for Business Admin to manage Organizations
 */
@Slf4j
@RestController
@RequestMapping("/admin/organizations")
@RequiredArgsConstructor
@PreAuthorize("hasRole('BUSINESS_ADMIN')")
public class AdminOrganizationController {

  private final UserService userService;

  /**
   * Get all organizations with optional filters
   * GET /api/v1/admin/organizations
   */
  @GetMapping
  public ResponseEntity<Page<AdminOrganizationResponse>> getAllOrganizations(
      @RequestParam(name = "status", required = false) UserStatus status,
      @RequestParam(name = "search", required = false) String search,
      @RequestParam(name = "page", defaultValue = "0") int page,
      @RequestParam(name = "size", defaultValue = "20") int size,
      @RequestParam(name = "sort", defaultValue = "createdAt") String sort,
      @RequestParam(name = "order", defaultValue = "desc") String order) {

    // Trim search string
    String trimmedSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;

    // Map frontend field names to entity field names
    // Frontend uses "organizationName" but entity has "fullName"
    if ("organizationName".equalsIgnoreCase(sort)) {
      sort = "fullName";
    }
    // Frontend uses "organizationEmail" but entity has "email"
    if ("organizationEmail".equalsIgnoreCase(sort)) {
      sort = "email";
    }
    // Frontend uses "adminEmail" but entity has "email" (admin is the user)
    if ("adminEmail".equalsIgnoreCase(sort)) {
      sort = "email";
    }

    // Validate sortBy - only allow valid User entity fields
    // Valid fields: email, fullName, status, createdAt, updatedAt
    String[] validSortFields = {"email", "fullName", "status", "createdAt", "updatedAt"};
    boolean isValidField = false;
    for (String validField : validSortFields) {
      if (validField.equalsIgnoreCase(sort)) {
        isValidField = true;
        sort = validField; // Normalize case
        break;
      }
    }
    
    // If invalid field, default to createdAt
    if (!isValidField) {
      log.warn("Invalid sort field: {}. Defaulting to createdAt", sort);
      sort = "createdAt";
    }

    log.info("Admin get all organizations - status: {}, search: {}, page: {}, size: {}, sort: {}, order: {}",
        status, trimmedSearch, page, size, sort, order);

    Sort.Direction direction =
        order.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
    Pageable pageable = PageRequest.of(page, size, Sort.by(direction, sort));

    Page<AdminOrganizationResponse> organizations = userService.getAllOrganizations(status, trimmedSearch,
        pageable);

    return ResponseEntity.ok(organizations);
  }

  /**
   * Get organization detail by ID
   * GET /api/v1/admin/organizations/{userId}
   */
  @GetMapping("/{userId}")
  public ResponseEntity<AdminOrganizationResponse> getOrganizationDetail(
      @PathVariable(name = "userId") UUID userId) {
    log.info("Admin get organization detail for ID: {}", userId);

    AdminOrganizationResponse organization = userService.getOrganizationDetail(userId);

    return ResponseEntity.ok(organization);
  }

  /**
   * Update organization status
   * PUT /api/v1/admin/organizations/{userId}/status
   */
  @PutMapping("/{userId}/status")
  public ResponseEntity<AdminOrganizationResponse> updateOrganizationStatus(
      @PathVariable(name = "userId") UUID userId,
      @Valid @RequestBody UpdateUserStatusRequest request) {

    log.info("Admin update organization status for ID: {} to {}", userId, request.getStatus());

    AdminOrganizationResponse organization = userService.updateOrganizationStatus(userId, request);

    return ResponseEntity.ok(organization);
  }
}
