package com.capstone.be.util;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

/**
 * Utility class for extracting information from HTTP requests
 */
public class HttpRequestUtil {

    /**
     * Extract IP address from HTTP request
     * Handles proxy headers (X-Forwarded-For, X-Real-IP)
     *
     * @param request HTTP servlet request
     * @return IP address string
     */
    public static String extractIpAddress(HttpServletRequest request) {
        if (request == null) {
            return null;
        }

        String ipAddress = request.getHeader("X-Forwarded-For");
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("X-Real-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("Proxy-Client-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getRemoteAddr();
        }

        // Take first IP if there are multiple (proxy chain)
        if (ipAddress != null && ipAddress.contains(",")) {
            ipAddress = ipAddress.split(",")[0].trim();
        }

        return ipAddress;
    }

    /**
     * Extract IP address from current request context
     * Useful for async operations where HttpServletRequest is not directly available
     *
     * @return IP address string or null if not available
     */
    public static String extractIpAddressFromContext() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                return extractIpAddress(request);
            }
        } catch (Exception e) {
            // Ignore - request context might not be available in async context
        }
        return null;
    }

    /**
     * Extract user agent from HTTP request
     *
     * @param request HTTP servlet request
     * @return User agent string
     */
    public static String extractUserAgent(HttpServletRequest request) {
        if (request == null) {
            return null;
        }
        return request.getHeader("User-Agent");
    }

    /**
     * Extract user agent from current request context
     *
     * @return User agent string or null if not available
     */
    public static String extractUserAgentFromContext() {
        try {
            ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attributes != null) {
                HttpServletRequest request = attributes.getRequest();
                return extractUserAgent(request);
            }
        } catch (Exception e) {
            // Ignore
        }
        return null;
    }
}

