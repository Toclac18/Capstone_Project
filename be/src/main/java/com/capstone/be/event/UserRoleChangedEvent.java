package com.capstone.be.event;

import com.capstone.be.domain.enums.UserRole;
import java.util.UUID;

/** Vai trò một người dùng vừa đổi. */
public record UserRoleChangedEvent(
    UUID userId,
    String email,
    String fullName,
    UserRole oldRole,
    UserRole newRole,
    String reason
) {}
