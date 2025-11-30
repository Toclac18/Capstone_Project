package com.capstone.be.controller;

import com.capstone.be.dto.common.PagedResponse;
import com.capstone.be.dto.request.admin.SystemLogQueryRequest;
import com.capstone.be.dto.response.admin.SystemLogResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for system log management
 * Only accessible by SYSTEM_ADMIN
 */
@Slf4j
@RestController
@RequestMapping("/system-admin/logs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SYSTEM_ADMIN')")
@Tag(name = "System Logs", description = "APIs for viewing system audit logs")
public class SystemLogController {

    private final com.capstone.be.service.SystemLogService systemLogService;

    /**
     * Get all logs with filters
     * GET /api/v1/system-admin/logs
     */
    @GetMapping
    @Operation(summary = "Get system logs with filters", description = "Get paginated system logs with various filters")
    public ResponseEntity<PagedResponse<SystemLogResponse>> getLogs(
        @RequestParam(required = false) String action,
        @RequestParam(required = false) java.util.List<String> actions,
        @RequestParam(required = false) UUID userId,
        @RequestParam(required = false) UUID targetUserId,
        @RequestParam(required = false) String userRole,
        @RequestParam(required = false) String ipAddress,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
        @RequestParam(required = false) String search,
        @PageableDefault(size = 20, sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable
    ) {
        log.info("System admin querying logs - action: {}, userId: {}, startDate: {}, endDate: {}",
            action, userId, startDate, endDate);

        SystemLogQueryRequest queryRequest = SystemLogQueryRequest.builder()
            .action(action)
            .actions(actions)
            .userId(userId)
            .targetUserId(targetUserId)
            .userRole(userRole)
            .ipAddress(ipAddress)
            .startDate(startDate)
            .endDate(endDate)
            .search(search)
            .build();

        var page = systemLogService.getLogs(queryRequest, pageable);
        return ResponseEntity.ok(PagedResponse.of(page, "Logs retrieved successfully"));
    }

    /**
     * Get logs by action
     * GET /api/v1/system-admin/logs/action/{action}
     */
    @GetMapping("/action/{action}")
    @Operation(summary = "Get logs by action", description = "Get logs filtered by specific action type")
    public ResponseEntity<PagedResponse<SystemLogResponse>> getLogsByAction(
        @PathVariable String action,
        @PageableDefault(size = 20, sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable
    ) {
        log.info("System admin querying logs by action: {}", action);
        var page = systemLogService.getLogsByAction(action, pageable);
        return ResponseEntity.ok(PagedResponse.of(page, "Logs retrieved successfully"));
    }

    /**
     * Get logs by user ID
     * GET /api/v1/system-admin/logs/user/{userId}
     */
    @GetMapping("/user/{userId}")
    @Operation(summary = "Get logs by user", description = "Get all logs for a specific user")
    public ResponseEntity<PagedResponse<SystemLogResponse>> getLogsByUserId(
        @PathVariable UUID userId,
        @PageableDefault(size = 20, sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable
    ) {
        log.info("System admin querying logs for user: {}", userId);
        var page = systemLogService.getLogsByUserId(userId, pageable);
        return ResponseEntity.ok(PagedResponse.of(page, "Logs retrieved successfully"));
    }

    /**
     * Get logs by date range
     * GET /api/v1/system-admin/logs/date-range
     */
    @GetMapping("/date-range")
    @Operation(summary = "Get logs by date range", description = "Get logs within a specific date range")
    public ResponseEntity<PagedResponse<SystemLogResponse>> getLogsByDateRange(
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
        @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
        @PageableDefault(size = 20, sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable
    ) {
        log.info("System admin querying logs from {} to {}", startDate, endDate);
        var page = systemLogService.getLogsByDateRange(startDate, endDate, pageable);
        return ResponseEntity.ok(PagedResponse.of(page, "Logs retrieved successfully"));
    }

    /**
     * Get login failed attempts
     * GET /api/v1/system-admin/logs/login-failed
     */
    @GetMapping("/login-failed")
    @Operation(summary = "Get login failed attempts", description = "Get all failed login attempts for security monitoring")
    public ResponseEntity<PagedResponse<SystemLogResponse>> getLoginFailedAttempts(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
        @PageableDefault(size = 20, sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable
    ) {
        if (startDate == null) {
            startDate = Instant.now().minus(java.time.Duration.ofDays(7));
        }
        if (endDate == null) {
            endDate = Instant.now();
        }

        log.info("System admin querying login failed attempts from {} to {}", startDate, endDate);
        var page = systemLogService.getLoginFailedAttempts(startDate, endDate, pageable);
        return ResponseEntity.ok(PagedResponse.of(page, "Login failed attempts retrieved successfully"));
    }

    /**
     * Get login failed attempts by IP
     * GET /api/v1/system-admin/logs/login-failed/ip/{ipAddress}
     */
    @GetMapping("/login-failed/ip/{ipAddress}")
    @Operation(summary = "Get login failed attempts by IP", description = "Get failed login attempts from a specific IP address")
    public ResponseEntity<PagedResponse<SystemLogResponse>> getLoginFailedAttemptsByIp(
        @PathVariable String ipAddress,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate,
        @PageableDefault(size = 20, sort = "createdAt", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable
    ) {
        if (startDate == null) {
            startDate = Instant.now().minus(java.time.Duration.ofDays(7));
        }
        if (endDate == null) {
            endDate = Instant.now();
        }

        log.info("System admin querying login failed attempts for IP: {} from {} to {}", ipAddress, startDate, endDate);
        var page = systemLogService.getLoginFailedAttemptsByIp(ipAddress, startDate, endDate, pageable);
        return ResponseEntity.ok(PagedResponse.of(page, "Login failed attempts retrieved successfully"));
    }

    /**
     * Get log by ID
     * GET /api/v1/system-admin/logs/{logId}
     */
    @GetMapping("/{logId}")
    @Operation(summary = "Get log by ID", description = "Get detailed information about a specific log entry")
    public ResponseEntity<SystemLogResponse> getLogById(@PathVariable UUID logId) {
        log.info("System admin querying log by ID: {}", logId);
        SystemLogResponse log = systemLogService.getLogById(logId);
        return ResponseEntity.ok(log);
    }

    /**
     * Get statistics
     * GET /api/v1/system-admin/logs/statistics
     */
    @GetMapping("/statistics")
    @Operation(summary = "Get log statistics", description = "Get statistics about system logs")
    public ResponseEntity<java.util.Map<String, Object>> getStatistics(
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant startDate,
        @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) Instant endDate
    ) {
        if (startDate == null) {
            startDate = Instant.now().minus(java.time.Duration.ofDays(30));
        }
        if (endDate == null) {
            endDate = Instant.now();
        }

        log.info("System admin querying log statistics from {} to {}", startDate, endDate);
        var stats = systemLogService.getStatistics(startDate, endDate);
        return ResponseEntity.ok(stats);
    }
}

