package com.capstone.be.service;

import com.capstone.be.dto.request.admin.SystemLogQueryRequest;
import com.capstone.be.dto.response.admin.SystemLogResponse;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service for querying system logs
 */
public interface SystemLogService {

    /**
     * Get all logs with filters
     *
     * @param queryRequest Filter parameters
     * @param pageable     Pagination parameters
     * @return Page of system logs
     */
    Page<SystemLogResponse> getLogs(SystemLogQueryRequest queryRequest, Pageable pageable);

    /**
     * Get logs by action
     *
     * @param action   Action type
     * @param pageable Pagination parameters
     * @return Page of system logs
     */
    Page<SystemLogResponse> getLogsByAction(String action, Pageable pageable);

    /**
     * Get logs by user ID
     *
     * @param userId   User ID
     * @param pageable Pagination parameters
     * @return Page of system logs
     */
    Page<SystemLogResponse> getLogsByUserId(UUID userId, Pageable pageable);

    /**
     * Get logs by date range
     *
     * @param startDate Start date
     * @param endDate   End date
     * @param pageable  Pagination parameters
     * @return Page of system logs
     */
    Page<SystemLogResponse> getLogsByDateRange(Instant startDate, Instant endDate, Pageable pageable);

    /**
     * Get login failed attempts
     *
     * @param startDate Start date
     * @param endDate   End date
     * @param pageable  Pagination parameters
     * @return Page of system logs
     */
    Page<SystemLogResponse> getLoginFailedAttempts(Instant startDate, Instant endDate, Pageable pageable);

    /**
     * Get login failed attempts by IP
     *
     * @param ipAddress IP address
     * @param startDate Start date
     * @param endDate   End date
     * @param pageable  Pagination parameters
     * @return Page of system logs
     */
    Page<SystemLogResponse> getLoginFailedAttemptsByIp(
        String ipAddress,
        Instant startDate,
        Instant endDate,
        Pageable pageable
    );

    /**
     * Get log by ID
     *
     * @param logId Log ID
     * @return System log response
     */
    SystemLogResponse getLogById(UUID logId);

    /**
     * Get statistics
     *
     * @param startDate Start date
     * @param endDate   End date
     * @return Statistics map
     */
    java.util.Map<String, Object> getStatistics(Instant startDate, Instant endDate);
}

