package com.capstone.be.domain.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

/**
 * Enum for system audit log actions
 */
@Getter
@AllArgsConstructor
public enum LogAction {
    // Authentication
    USER_LOGIN_SUCCESS("User login successful"),
    USER_LOGIN_FAILED("User login failed"),
    USER_LOGOUT("User logout"),
    PASSWORD_CHANGED("Password changed"),
    EMAIL_CHANGED("Email changed"),
    PASSWORD_RESET("Password reset"),
    ACCOUNT_DELETED("Account deleted"),

    // Admin Actions - User Management
    ROLE_CHANGED("User role changed"),
    USER_STATUS_CHANGED("User status changed"),
    USER_APPROVED("User approved"),
    USER_REJECTED("User rejected"),

    // System Admin Actions
    SYSTEM_CONFIG_CREATED("System config created"),
    SYSTEM_CONFIG_UPDATED("System config updated"),
    SYSTEM_CONFIG_DELETED("System config deleted"),
    PERMISSION_ASSIGNED("Permission assigned"),
    PERMISSION_REVOKED("Permission revoked"),

    // Document Actions
    DOCUMENT_UPLOADED("Document uploaded"),
    DOCUMENT_DELETED("Document deleted"),
    DOCUMENT_REDEEMED("Document redeemed"),
    DOCUMENT_STATUS_CHANGED("Document status changed"),

    // Approval Actions
    REVIEWER_APPROVED("Reviewer approved"),
    REVIEWER_REJECTED("Reviewer rejected"),
    ORGANIZATION_APPROVED("Organization approved"),
    ORGANIZATION_REJECTED("Organization rejected");

    private final String description;
}

