package com.capstone.be.controller;

import com.capstone.be.dto.request.admin.ChangeRoleRequest;
import com.capstone.be.dto.request.admin.UserQueryRequest;
import com.capstone.be.dto.response.admin.UserManagementResponse;
import com.capstone.be.security.model.UserPrincipal;
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
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for System Admin to manage users and roles
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/system-admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SYSTEM_ADMIN')")
public class SystemAdminController {

  private final UserService userService;

  /**
   * Get all users with optional filters for role management
   * POST /api/system-admin/users
   * 
   * Note: Using POST to support complex query parameters in request body
   */
  @PostMapping
  public ResponseEntity<Page<UserManagementResponse>> getAllUsers(
      @RequestBody(required = false) UserQueryRequest request) {

    if (request == null) {
      request = UserQueryRequest.builder().build();
    }

    // Convert from 1-based (frontend) to 0-based (Spring Page)
    int page = request.getPage() != null ? Math.max(0, request.getPage() - 1) : 0;
    int limit = request.getLimit() != null ? request.getLimit() : 10;
    String sortBy = request.getSortBy() != null ? request.getSortBy() : "createdAt";
    String sortOrder = request.getSortOrder() != null ? request.getSortOrder() : "desc";

    log.info("System admin get all users - search: {}, role: {}, status: {}, page: {}, limit: {}",
        request.getSearch(), request.getRole(), request.getStatus(), page, limit);

    Sort.Direction direction =
        sortOrder.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC;
    Pageable pageable = PageRequest.of(page, limit, Sort.by(direction, sortBy));

    Page<UserManagementResponse> users = userService.getAllUsersForRoleManagement(
        request.getSearch(), request.getRole(), request.getStatus(),
        request.getDateFrom(), request.getDateTo(), pageable);

    return ResponseEntity.ok(users);
  }

  /**
   * Change user role
   * PATCH /api/system-admin/users/{userId}/role
   */
  @PatchMapping("/{userId}/role")
  public ResponseEntity<UserManagementResponse> changeUserRole(
      @PathVariable(name = "userId") UUID userId,
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @Valid @RequestBody ChangeRoleRequest request) {

    log.info("System admin {} changing role for user {} to {}",
        userPrincipal.getId(), userId, request.getRole());

    UserManagementResponse updatedUser = userService.changeUserRole(
        userId, request, userPrincipal.getId());

    return ResponseEntity.ok(updatedUser);
  }
}

