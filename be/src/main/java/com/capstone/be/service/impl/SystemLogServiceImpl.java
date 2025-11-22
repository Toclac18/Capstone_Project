package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.SystemLog;
import com.capstone.be.dto.request.admin.SystemLogQueryRequest;
import com.capstone.be.dto.response.admin.SystemLogResponse;
import com.capstone.be.repository.SystemLogRepository;
import com.capstone.be.service.SystemLogService;
import java.time.Instant;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Slf4j
@Service
@RequiredArgsConstructor
public class SystemLogServiceImpl implements SystemLogService {

    private final SystemLogRepository systemLogRepository;

    @Override
    @Transactional(readOnly = true)
    public Page<SystemLogResponse> getLogs(SystemLogQueryRequest queryRequest, Pageable pageable) {
        Specification<SystemLog> spec = buildSpecification(queryRequest);
        Page<SystemLog> logs = systemLogRepository.findAll(spec, pageable);
        return logs.map(SystemLogResponse::from);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SystemLogResponse> getLogsByAction(String action, Pageable pageable) {
        Page<SystemLog> logs = systemLogRepository.findByActionOrderByCreatedAtDesc(action, pageable);
        return logs.map(SystemLogResponse::from);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SystemLogResponse> getLogsByUserId(UUID userId, Pageable pageable) {
        Page<SystemLog> logs = systemLogRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        return logs.map(SystemLogResponse::from);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SystemLogResponse> getLogsByDateRange(Instant startDate, Instant endDate, Pageable pageable) {
        Page<SystemLog> logs = systemLogRepository.findByDateRange(startDate, endDate, pageable);
        return logs.map(SystemLogResponse::from);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SystemLogResponse> getLoginFailedAttempts(Instant startDate, Instant endDate, Pageable pageable) {
        Page<SystemLog> logs = systemLogRepository.findLoginFailedAttempts(startDate, endDate, pageable);
        return logs.map(SystemLogResponse::from);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<SystemLogResponse> getLoginFailedAttemptsByIp(
        String ipAddress,
        Instant startDate,
        Instant endDate,
        Pageable pageable
    ) {
        Page<SystemLog> logs = systemLogRepository.findLoginFailedAttemptsByIp(ipAddress, startDate, endDate, pageable);
        return logs.map(SystemLogResponse::from);
    }

    @Override
    @Transactional(readOnly = true)
    public SystemLogResponse getLogById(UUID logId) {
        SystemLog log = systemLogRepository.findById(logId)
            .orElseThrow(() -> new com.capstone.be.exception.ResourceNotFoundException("Log not found with ID: " + logId));
        return SystemLogResponse.from(log);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getStatistics(Instant startDate, Instant endDate) {
        Map<String, Object> stats = new HashMap<>();

        // Count by action
        List<String> actions = List.of(
            "USER_LOGIN_SUCCESS",
            "USER_LOGIN_FAILED",
            "ROLE_CHANGED",
            "USER_STATUS_CHANGED",
            "SYSTEM_CONFIG_UPDATED"
        );

        Map<String, Long> actionCounts = actions.stream()
            .collect(Collectors.toMap(
                action -> action,
                action -> systemLogRepository.countByActionAndDateRange(action, startDate, endDate)
            ));

        stats.put("actionCounts", actionCounts);
        stats.put("totalLogs", systemLogRepository.count());
        stats.put("dateRange", Map.of("start", startDate, "end", endDate));

        return stats;
    }

    private Specification<SystemLog> buildSpecification(SystemLogQueryRequest request) {
        Specification<SystemLog> spec = Specification.where(null);

        if (StringUtils.hasText(request.getAction())) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("action"), request.getAction()));
        }

        if (request.getActions() != null && !request.getActions().isEmpty()) {
            spec = spec.and((root, query, cb) -> root.get("action").in(request.getActions()));
        }

        if (request.getUserId() != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("userId"), request.getUserId()));
        }

        if (request.getTargetUserId() != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("targetUserId"), request.getTargetUserId()));
        }

        if (StringUtils.hasText(request.getUserRole())) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("userRole"), request.getUserRole()));
        }

        if (StringUtils.hasText(request.getIpAddress())) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("ipAddress"), request.getIpAddress()));
        }

        if (request.getStartDate() != null) {
            spec = spec.and((root, query, cb) -> cb.greaterThanOrEqualTo(root.get("createdAt"), request.getStartDate()));
        }

        if (request.getEndDate() != null) {
            spec = spec.and((root, query, cb) -> cb.lessThanOrEqualTo(root.get("createdAt"), request.getEndDate()));
        }

        if (StringUtils.hasText(request.getSearch())) {
            String searchPattern = "%" + request.getSearch().toLowerCase() + "%";
            spec = spec.and((root, query, cb) ->
                cb.or(
                    cb.like(cb.lower(root.get("details").as(String.class)), searchPattern),
                    cb.like(cb.lower(root.get("action")), searchPattern)
                )
            );
        }

        return spec;
    }
}

