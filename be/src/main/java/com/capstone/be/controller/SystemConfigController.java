package com.capstone.be.controller;

import com.capstone.be.domain.enums.LogAction;
import com.capstone.be.dto.request.admin.UpdateSystemConfigRequest;
import com.capstone.be.dto.response.admin.SystemConfigResponse;
import com.capstone.be.security.model.UserPrincipal;
import com.capstone.be.service.AuditLogService;
import com.capstone.be.service.SystemConfigService;
import com.capstone.be.util.HttpRequestUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for System Admin to manage system configurations
 */
@Slf4j
@RestController
@RequestMapping("/system-admin/configs")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SYSTEM_ADMIN')")
public class SystemConfigController {

  private final SystemConfigService systemConfigService;
  private final AuditLogService auditLogService;

  /**
   * Get all system configurations
   * GET /api/system-admin/configs
   */
  @GetMapping
  public ResponseEntity<List<SystemConfigResponse>> getAllConfigs() {
    log.info("System admin fetching all system configs");
    List<SystemConfigResponse> configs = systemConfigService.getAllConfigs();
    return ResponseEntity.ok(configs);
  }

  /**
   * Get system configuration by key
   * GET /api/system-admin/configs/{key}
   */
  @GetMapping("/{key}")
  public ResponseEntity<SystemConfigResponse> getConfigByKey(@PathVariable String key) {
    log.info("System admin fetching config: {}", key);
    SystemConfigResponse config = systemConfigService.getConfigByKey(key);
    return ResponseEntity.ok(config);
  }

  /**
   * Update system configuration
   * PUT /api/system-admin/configs/{key}
   */
  @PutMapping("/{key}")
  public ResponseEntity<SystemConfigResponse> updateConfig(
      @PathVariable String key,
      @Valid @RequestBody UpdateSystemConfigRequest request,
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      HttpServletRequest httpRequest) {

    log.info("System admin {} updating config: {}", userPrincipal.getId(), key);

    // Extract IP and User-Agent for logging
    String ipAddress = HttpRequestUtil.extractIpAddress(httpRequest);
    String userAgent = HttpRequestUtil.extractUserAgent(httpRequest);

    try {
      // Get old value before update
      String oldValue = systemConfigService.getStringValue(key, "");

      // Update config
      SystemConfigResponse updated = systemConfigService.updateConfig(key, request);

      // Log successful update
      Map<String, Object> details = new HashMap<>();
      details.put("configKey", key);
      details.put("oldValue", oldValue);
      details.put("newValue", request.getConfigValue());

      auditLogService.logAction(
          LogAction.SYSTEM_CONFIG_UPDATED,
          userPrincipal,
          details,
          ipAddress,
          userAgent,
          200 // HTTP 200 OK
      );

      log.debug("Audit log saved for SYSTEM_CONFIG_UPDATED action");

      return ResponseEntity.ok(updated);
    } catch (Exception e) {
      // Log failed update
      Map<String, Object> details = new HashMap<>();
      details.put("configKey", key);
      details.put("requestedValue", request.getConfigValue());

      auditLogService.logFailedAction(
          LogAction.SYSTEM_CONFIG_UPDATED,
          userPrincipal,
          details,
          "Failed to update config: " + e.getMessage(),
          ipAddress,
          userAgent,
          500 // HTTP 500 Internal Server Error
      );

      log.error("Failed to update system config and logged failure", e);
      throw e; // Re-throw to be handled by GlobalExceptionHandler
    }
  }
}

