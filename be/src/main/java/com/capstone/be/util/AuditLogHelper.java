package com.capstone.be.util;

import com.capstone.be.domain.enums.LogAction;
import com.capstone.be.security.model.UserPrincipal;
import com.capstone.be.service.AuditLogService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Helper utility for audit logging
 * Provides convenient methods to log actions without cluttering controller/service code
 * All logging is async and non-blocking - failures won't affect business logic
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AuditLogHelper {

    private final AuditLogService auditLogService;

    /**
     * Extract IP address from request
     */
    public static String getClientIpAddress(HttpServletRequest request) {
        if (request == null) {
            return null;
        }

        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }

        // Handle multiple IPs (X-Forwarded-For can contain multiple IPs)
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }

        return ip;
    }

    /**
     * Extract User-Agent from request
     */
    public static String getUserAgent(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        return request.getHeader("User-Agent");
    }

    /**
     * Get current HttpServletRequest from Spring context
     */
    public static HttpServletRequest getCurrentRequest() {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        return attributes != null ? attributes.getRequest() : null;
    }

    /**
     * Log a successful action
     */
    public void logSuccess(LogAction action, UserPrincipal user, Map<String, Object> details, Integer statusCode) {
        try {
            HttpServletRequest request = getCurrentRequest();
            String ipAddress = getClientIpAddress(request);
            String userAgent = getUserAgent(request);

            auditLogService.logAction(action, user, details, ipAddress, userAgent, statusCode);
        } catch (Exception e) {
            // Never throw - logging failure should not affect business logic
            log.warn("Failed to log action {}: {}", action, e.getMessage());
        }
    }

    /**
     * Log a successful action with target user
     */
    public void logSuccessWithTarget(LogAction action, UserPrincipal user, UUID targetUserId, 
                                     Map<String, Object> details, Integer statusCode) {
        try {
            HttpServletRequest request = getCurrentRequest();
            String ipAddress = getClientIpAddress(request);
            String userAgent = getUserAgent(request);

            auditLogService.logActionWithTarget(action, user, targetUserId, details, ipAddress, userAgent, statusCode);
        } catch (Exception e) {
            log.warn("Failed to log action {}: {}", action, e.getMessage());
        }
    }

    /**
     * Log a successful action with target resource
     */
    public void logSuccessWithResource(LogAction action, UserPrincipal user, String targetResourceType,
                                       UUID targetResourceId, Map<String, Object> details, Integer statusCode) {
        try {
            HttpServletRequest request = getCurrentRequest();
            String ipAddress = getClientIpAddress(request);
            String userAgent = getUserAgent(request);

            auditLogService.logActionWithResource(action, user, targetResourceType, targetResourceId,
                details, ipAddress, userAgent, statusCode);
        } catch (Exception e) {
            log.warn("Failed to log action {}: {}", action, e.getMessage());
        }
    }

    /**
     * Log a failed action
     */
    public void logFailure(LogAction action, UserPrincipal user, Map<String, Object> details,
                          String errorMessage, Integer statusCode) {
        try {
            HttpServletRequest request = getCurrentRequest();
            String ipAddress = getClientIpAddress(request);
            String userAgent = getUserAgent(request);

            auditLogService.logFailedAction(action, user, details, errorMessage, ipAddress, userAgent, statusCode);
        } catch (Exception e) {
            log.warn("Failed to log failed action {}: {}", action, e.getMessage());
        }
    }

    /**
     * Create a details map builder for convenience
     */
    public static Map<String, Object> details() {
        return new HashMap<>();
    }

    /**
     * Create a details map with initial key-value pair
     */
    public static Map<String, Object> details(String key, Object value) {
        Map<String, Object> map = new HashMap<>();
        map.put(key, value);
        return map;
    }

    /**
     * Create a details map with multiple key-value pairs
     * Usage: details("key1", value1, "key2", value2, ...)
     */
    public static Map<String, Object> details(Object... keyValuePairs) {
        Map<String, Object> map = new HashMap<>();
        if (keyValuePairs.length % 2 != 0) {
            throw new IllegalArgumentException("Key-value pairs must be even number");
        }
        for (int i = 0; i < keyValuePairs.length; i += 2) {
            map.put(keyValuePairs[i].toString(), keyValuePairs[i + 1]);
        }
        return map;
    }
}

