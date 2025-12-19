package com.capstone.be.dto.response.admin;

import com.capstone.be.domain.entity.SystemLog;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemLogResponse {
    private UUID id;
    private String action;
    private UUID userId;
    private String userRole;
    private UUID targetUserId;
    private String targetResourceType;
    private UUID targetResourceId;
    private String details;
    private String ipAddress;
    private String userAgent;
    private String requestMethod;
    private String requestPath;
    private Integer statusCode;
    private String errorMessage;
    private Instant createdAt;

    public static SystemLogResponse from(SystemLog log) {
        return SystemLogResponse.builder()
            .id(log.getId())
            .action(log.getAction())
            .userId(log.getUserId())
            .userRole(log.getUserRole())
            .targetUserId(log.getTargetUserId())
            .targetResourceType(log.getTargetResourceType())
            .targetResourceId(log.getTargetResourceId())
            .details(log.getDetails())
            .ipAddress(log.getIpAddress())
            .userAgent(log.getUserAgent())
            .requestMethod(log.getRequestMethod())
            .requestPath(log.getRequestPath())
            .statusCode(log.getStatusCode())
            .errorMessage(log.getErrorMessage())
            .createdAt(log.getCreatedAt())
            .build();
    }
}

