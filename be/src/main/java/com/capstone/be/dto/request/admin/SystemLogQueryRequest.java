package com.capstone.be.dto.request.admin;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SystemLogQueryRequest {
    /**
     * Filter by action type (e.g., "USER_LOGIN_SUCCESS")
     */
    private String action;

    /**
     * Filter by multiple actions
     */
    private List<String> actions;

    /**
     * Filter by user ID (user who performed the action)
     */
    private UUID userId;

    /**
     * Filter by target user ID (user affected by the action)
     */
    private UUID targetUserId;

    /**
     * Filter by user role
     */
    private String userRole;

    /**
     * Filter by IP address
     */
    private String ipAddress;

    /**
     * Start date for date range filter
     */
    private Instant startDate;

    /**
     * End date for date range filter
     */
    private Instant endDate;

    /**
     * Search in details field (JSON search)
     */
    private String search;
}

