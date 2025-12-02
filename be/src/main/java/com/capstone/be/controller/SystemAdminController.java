package com.capstone.be.controller;

import com.capstone.be.domain.enums.LogAction;
import com.capstone.be.dto.request.admin.ChangeRoleRequest;
import com.capstone.be.dto.request.admin.UserQueryRequest;
import com.capstone.be.dto.response.admin.UserManagementResponse;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.security.model.UserPrincipal;
import com.capstone.be.service.AuditLogService;
import com.capstone.be.service.UserService;
import com.capstone.be.util.HttpRequestUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.Map;
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
@RequestMapping("/system-admin/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SYSTEM_ADMIN')")
public class SystemAdminController {

  private final UserService userService;
  private final UserRepository userRepository;
  private final AuditLogService auditLogService;

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
      @Valid @RequestBody ChangeRoleRequest request,
      HttpServletRequest httpRequest) {

    // Extract IP and User-Agent for logging
    String ipAddress = HttpRequestUtil.extractIpAddress(httpRequest);
    String userAgent = HttpRequestUtil.extractUserAgent(httpRequest);

    log.info("System admin {} changing role for user {} to {}",
        userPrincipal.getId(), userId, request.getRole());

    try {
      // Get old role before change
      String oldRole = userRepository.findById(userId)
          .map(user -> user.getRole().name())
          .orElse("UNKNOWN");

      // Change role
      UserManagementResponse updatedUser = userService.changeUserRole(
          userId, request, userPrincipal.getId());

      // Log successful role change
      Map<String, Object> details = new HashMap<>();
      details.put("targetUserId", userId.toString());
      details.put("oldRole", oldRole);
      details.put("newRole", request.getRole().name());
      if (request.getReason() != null && !request.getReason().trim().isEmpty()) {
        details.put("reason", request.getReason());
      }

      auditLogService.logActionWithTarget(
          LogAction.ROLE_CHANGED,
          userPrincipal,
          userId,
          details,
          ipAddress,
          userAgent,
          200 // HTTP 200 OK
      );

      log.debug("Audit log saved for ROLE_CHANGED action");

      return ResponseEntity.ok(updatedUser);
    } catch (Exception e) {
      // Log failed role change attempt
      Map<String, Object> details = new HashMap<>();
      details.put("targetUserId", userId.toString());
      details.put("requestedRole", request.getRole().name());
      if (request.getReason() != null) {
        details.put("reason", request.getReason());
      }

      auditLogService.logFailedAction(
          LogAction.ROLE_CHANGED,
          userPrincipal,
          details,
          "Failed to change role: " + e.getMessage(),
          ipAddress,
          userAgent,
          500 // HTTP 500 Internal Server Error (or appropriate status code)
      );

      log.error("Failed to change user role and logged failure", e);
      throw e; // Re-throw to be handled by GlobalExceptionHandler
    }
  }
}

