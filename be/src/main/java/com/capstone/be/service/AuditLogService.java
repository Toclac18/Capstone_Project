package com.capstone.be.service;

import com.capstone.be.domain.enums.LogAction;
import com.capstone.be.security.model.UserPrincipal;
import java.util.Map;
import java.util.UUID;

/**
 * Service for logging audit events
 */
public interface AuditLogService {

    /**
     * Log an action with details
     *
     * @param action  Action type
     * @param user    User who performed the action (can be null for system actions)
     * @param details Additional details as key-value pairs
     * @param ipAddress IP address of the client
     * @param userAgent User agent string
     * @param statusCode HTTP status code (e.g., 200, 401, 500)
     */
    void logAction(
        LogAction action,
        UserPrincipal user,
        Map<String, Object> details,
        String ipAddress,
        String userAgent,
        Integer statusCode
    );

    /**
     * Log an action with target user
     *
     * @param action      Action type
     * @param user        User who performed the action
     * @param targetUserId Target user ID affected by the action
     * @param details     Additional details
     * @param ipAddress   IP address
     * @param userAgent   User agent
     * @param statusCode HTTP status code (e.g., 200, 401, 500)
     */
    void logActionWithTarget(
        LogAction action,
        UserPrincipal user,
        UUID targetUserId,
        Map<String, Object> details,
        String ipAddress,
        String userAgent,
        Integer statusCode
    );

    /**
     * Log an action with target resource
     *
     * @param action            Action type
     * @param user              User who performed the action
     * @param targetResourceType Type of resource (e.g., "USER", "CONFIG", "DOCUMENT")
     * @param targetResourceId   ID of the resource
     * @param details           Additional details
     * @param ipAddress         IP address
     * @param userAgent         User agent
     * @param statusCode HTTP status code (e.g., 200, 401, 500)
     */
    void logActionWithResource(
        LogAction action,
        UserPrincipal user,
        String targetResourceType,
        UUID targetResourceId,
        Map<String, Object> details,
        String ipAddress,
        String userAgent,
        Integer statusCode
    );

    /**
     * Log a failed action with error message
     *
     * @param action      Action type
     * @param user        User who attempted the action
     * @param details     Additional details
     * @param errorMessage Error message
     * @param ipAddress   IP address
     * @param userAgent   User agent
     * @param statusCode HTTP status code (e.g., 401, 403, 500)
     */
    void logFailedAction(
        LogAction action,
        UserPrincipal user,
        Map<String, Object> details,
        String errorMessage,
        String ipAddress,
        String userAgent,
        Integer statusCode
    );
}

