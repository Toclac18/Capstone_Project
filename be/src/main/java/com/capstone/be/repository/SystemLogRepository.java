package com.capstone.be.repository;

import com.capstone.be.domain.entity.SystemLog;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface SystemLogRepository extends JpaRepository<SystemLog, UUID>, JpaSpecificationExecutor<SystemLog> {

    /**
     * Find logs by action type
     */
    Page<SystemLog> findByActionOrderByCreatedAtDesc(String action, Pageable pageable);

    /**
     * Find logs by user ID (user who performed the action)
     */
    Page<SystemLog> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);

    /**
     * Find logs by target user ID (user affected by the action)
     */
    Page<SystemLog> findByTargetUserIdOrderByCreatedAtDesc(UUID targetUserId, Pageable pageable);

    /**
     * Find logs within date range
     */
    @Query("SELECT l FROM SystemLog l WHERE l.createdAt BETWEEN :startDate AND :endDate ORDER BY l.createdAt DESC")
    Page<SystemLog> findByDateRange(
        @Param("startDate") Instant startDate,
        @Param("endDate") Instant endDate,
        Pageable pageable
    );

    /**
     * Find logs by action and date range
     */
    @Query("SELECT l FROM SystemLog l WHERE l.action = :action AND l.createdAt BETWEEN :startDate AND :endDate ORDER BY l.createdAt DESC")
    Page<SystemLog> findByActionAndDateRange(
        @Param("action") String action,
        @Param("startDate") Instant startDate,
        @Param("endDate") Instant endDate,
        Pageable pageable
    );

    /**
     * Find logs by user and date range
     */
    @Query("SELECT l FROM SystemLog l WHERE l.userId = :userId AND l.createdAt BETWEEN :startDate AND :endDate ORDER BY l.createdAt DESC")
    Page<SystemLog> findByUserIdAndDateRange(
        @Param("userId") UUID userId,
        @Param("startDate") Instant startDate,
        @Param("endDate") Instant endDate,
        Pageable pageable
    );

    /**
     * Find logs by action, user and date range
     */
    @Query("SELECT l FROM SystemLog l WHERE l.action = :action AND l.userId = :userId AND l.createdAt BETWEEN :startDate AND :endDate ORDER BY l.createdAt DESC")
    Page<SystemLog> findByActionAndUserIdAndDateRange(
        @Param("action") String action,
        @Param("userId") UUID userId,
        @Param("startDate") Instant startDate,
        @Param("endDate") Instant endDate,
        Pageable pageable
    );

    /**
     * Find logs by IP address
     */
    Page<SystemLog> findByIpAddressOrderByCreatedAtDesc(String ipAddress, Pageable pageable);

    /**
     * Find logs by IP address and date range
     */
    @Query("SELECT l FROM SystemLog l WHERE l.ipAddress = :ipAddress AND l.createdAt BETWEEN :startDate AND :endDate ORDER BY l.createdAt DESC")
    Page<SystemLog> findByIpAddressAndDateRange(
        @Param("ipAddress") String ipAddress,
        @Param("startDate") Instant startDate,
        @Param("endDate") Instant endDate,
        Pageable pageable
    );

    /**
     * Find logs by user role
     */
    Page<SystemLog> findByUserRoleOrderByCreatedAtDesc(String userRole, Pageable pageable);

    /**
     * Find logs by multiple actions
     */
    @Query("SELECT l FROM SystemLog l WHERE l.action IN :actions ORDER BY l.createdAt DESC")
    Page<SystemLog> findByActionsIn(
        @Param("actions") List<String> actions,
        Pageable pageable
    );

    /**
     * Find logs by multiple actions and date range
     */
    @Query("SELECT l FROM SystemLog l WHERE l.action IN :actions AND l.createdAt BETWEEN :startDate AND :endDate ORDER BY l.createdAt DESC")
    Page<SystemLog> findByActionsInAndDateRange(
        @Param("actions") List<String> actions,
        @Param("startDate") Instant startDate,
        @Param("endDate") Instant endDate,
        Pageable pageable
    );

    /**
     * Find login failed attempts (for security monitoring)
     */
    @Query("SELECT l FROM SystemLog l WHERE l.action = 'USER_LOGIN_FAILED' AND l.createdAt BETWEEN :startDate AND :endDate ORDER BY l.createdAt DESC")
    Page<SystemLog> findLoginFailedAttempts(
        @Param("startDate") Instant startDate,
        @Param("endDate") Instant endDate,
        Pageable pageable
    );

    /**
     * Find login failed attempts by IP
     */
    @Query("SELECT l FROM SystemLog l WHERE l.action = 'USER_LOGIN_FAILED' AND l.ipAddress = :ipAddress AND l.createdAt BETWEEN :startDate AND :endDate ORDER BY l.createdAt DESC")
    Page<SystemLog> findLoginFailedAttemptsByIp(
        @Param("ipAddress") String ipAddress,
        @Param("startDate") Instant startDate,
        @Param("endDate") Instant endDate,
        Pageable pageable
    );

    /**
     * Count logs by action
     */
    long countByAction(String action);

    /**
     * Count logs by action and date range
     */
    @Query("SELECT COUNT(l) FROM SystemLog l WHERE l.action = :action AND l.createdAt BETWEEN :startDate AND :endDate")
    long countByActionAndDateRange(
        @Param("action") String action,
        @Param("startDate") Instant startDate,
        @Param("endDate") Instant endDate
    );

    /**
     * Delete logs older than specified date (for retention policy)
     */
    void deleteByCreatedAtBefore(Instant cutoffDate);

    /**
     * Count logs to be deleted (for monitoring)
     */
    long countByCreatedAtBefore(Instant cutoffDate);
}

