package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.SystemLog;
import com.capstone.be.domain.enums.LogAction;
import com.capstone.be.repository.SystemLogRepository;
import com.capstone.be.security.model.UserPrincipal;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Implementation of AuditLogService
 * All logging operations are async to avoid blocking main thread
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements com.capstone.be.service.AuditLogService {

    private final SystemLogRepository systemLogRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Async("auditLogExecutor")
    public void logAction(
        LogAction action,
        UserPrincipal user,
        Map<String, Object> details,
        String ipAddress,
        String userAgent
    ) {
        try {
            SystemLog systemLog = buildSystemLog(
                action,
                user,
                null,
                null,
                null,
                details,
                ipAddress,
                userAgent,
                null,
                null,
                null
            );

            systemLogRepository.save(systemLog);
        } catch (Exception e) {
            // Log error but don't throw - don't fail business logic due to logging failure
            log.error("Failed to save audit log for action {}: {}", action, e.getMessage());
        }
    }

    @Override
    @Async("auditLogExecutor")
    public void logActionWithTarget(
        LogAction action,
        UserPrincipal user,
        UUID targetUserId,
        Map<String, Object> details,
        String ipAddress,
        String userAgent
    ) {
        try {
            Map<String, Object> fullDetails = addToDetails(details, "targetUserId", targetUserId.toString());

            SystemLog systemLog = buildSystemLog(
                action,
                user,
                targetUserId,
                null,
                null,
                fullDetails,
                ipAddress,
                userAgent,
                null,
                null,
                null
            );

            systemLogRepository.save(systemLog);
        } catch (Exception e) {
            log.error("Failed to save audit log for action {}: {}", action, e.getMessage());
        }
    }

    @Override
    @Async("auditLogExecutor")
    public void logActionWithResource(
        LogAction action,
        UserPrincipal user,
        String targetResourceType,
        UUID targetResourceId,
        Map<String, Object> details,
        String ipAddress,
        String userAgent
    ) {
        try {
            SystemLog systemLog = buildSystemLog(
                action,
                user,
                null,
                targetResourceType,
                targetResourceId,
                details,
                ipAddress,
                userAgent,
                null,
                null,
                null
            );

            systemLogRepository.save(systemLog);
        } catch (Exception e) {
            log.error("Failed to save audit log for action {}: {}", action, e.getMessage());
        }
    }

    @Override
    @Async("auditLogExecutor")
    public void logFailedAction(
        LogAction action,
        UserPrincipal user,
        Map<String, Object> details,
        String errorMessage,
        String ipAddress,
        String userAgent
    ) {
        try {
            SystemLog systemLog = buildSystemLog(
                action,
                user,
                null,
                null,
                null,
                details,
                ipAddress,
                userAgent,
                null,
                null,
                errorMessage
            );

            systemLogRepository.save(systemLog);
        } catch (Exception e) {
            log.error("Failed to save audit log for action {}: {}", action, e.getMessage());
        }
    }

    private SystemLog buildSystemLog(
        LogAction action,
        UserPrincipal user,
        UUID targetUserId,
        String targetResourceType,
        UUID targetResourceId,
        Map<String, Object> details,
        String ipAddress,
        String userAgent,
        String requestMethod,
        String requestPath,
        String errorMessage
    ) {
        String detailsJson = null;
        if (details != null && !details.isEmpty()) {
            try {
                detailsJson = objectMapper.writeValueAsString(details);
            } catch (JsonProcessingException e) {
                log.warn("Failed to serialize details to JSON: {}", e.getMessage());
            }
        }

        return SystemLog.builder()
            .action(action.name())
            .userId(user != null ? user.getId() : null)
            .userRole(user != null ? user.getRole() : null)
            .targetUserId(targetUserId)
            .targetResourceType(targetResourceType)
            .targetResourceId(targetResourceId)
            .details(detailsJson)
            .ipAddress(ipAddress)
            .userAgent(userAgent)
            .requestMethod(requestMethod)
            .requestPath(requestPath)
            .errorMessage(errorMessage)
            .build();
    }

    private Map<String, Object> addToDetails(Map<String, Object> details, String key, String value) {
        if (details == null) {
            return Map.of(key, value);
        }
        Map<String, Object> newDetails = new java.util.HashMap<>(details);
        newDetails.put(key, value);
        return newDetails;
    }
}

