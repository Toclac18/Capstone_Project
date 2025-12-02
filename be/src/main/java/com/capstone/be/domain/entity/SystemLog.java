package com.capstone.be.domain.entity;

import com.capstone.be.domain.entity.common.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

/**
 * System audit log entity for tracking important system actions
 * Used for security, compliance, and debugging purposes
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(
    name = "system_logs",
    indexes = {
        @Index(name = "idx_logs_action", columnList = "action"),
        @Index(name = "idx_logs_user_id", columnList = "user_id"),
        @Index(name = "idx_logs_created_at", columnList = "created_at"),
        @Index(name = "idx_logs_action_created", columnList = "action,created_at"),
        @Index(name = "idx_logs_target_user", columnList = "target_user_id")
    }
)
public class SystemLog extends BaseEntity {

    @Column(nullable = false, length = 50)
    private String action;

    @Column(name = "user_id", columnDefinition = "UUID")
    private UUID userId;

    @Column(name = "user_role", length = 30)
    private String userRole;

    @Column(name = "target_user_id", columnDefinition = "UUID")
    private UUID targetUserId;

    @Column(name = "target_resource_type", length = 50)
    private String targetResourceType;

    @Column(name = "target_resource_id", columnDefinition = "UUID")
    private UUID targetResourceId;

    @Column(columnDefinition = "TEXT")
    private String details;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "user_agent", length = 500)
    private String userAgent;

    @Column(name = "request_method", length = 10)
    private String requestMethod;

    @Column(name = "request_path", length = 500)
    private String requestPath;

    @Column(name = "status_code")
    private Integer statusCode;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
}

