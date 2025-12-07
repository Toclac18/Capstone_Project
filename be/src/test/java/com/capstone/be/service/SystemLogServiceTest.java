package com.capstone.be.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isA;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.capstone.be.domain.entity.SystemLog;
import com.capstone.be.dto.request.admin.SystemLogQueryRequest;
import com.capstone.be.dto.response.admin.SystemLogResponse;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.repository.SystemLogRepository;
import com.capstone.be.service.impl.SystemLogServiceImpl;
import java.time.Instant;
import java.util.Arrays;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

@ExtendWith(MockitoExtension.class)
@DisplayName("SystemLogService Unit Tests")
class SystemLogServiceTest {

  @Mock
  private SystemLogRepository systemLogRepository;

  @InjectMocks
  private SystemLogServiceImpl systemLogService;

  private SystemLog systemLog;
  private UUID logId;
  private UUID userId;

  @BeforeEach
  void setUp() {
    logId = UUID.randomUUID();
    userId = UUID.randomUUID();

    systemLog = SystemLog.builder()
        .id(logId)
        .action("USER_LOGIN_SUCCESS")
        .userId(userId)
        .ipAddress("192.168.1.1")
        .userAgent("Mozilla/5.0")
        .createdAt(Instant.now())
        .build();
  }

  // test getLogs should return paginated logs
  @Test
  @DisplayName("getLogs should return paginated logs")
  void getLogs_ShouldReturnPaginatedLogs() {
    Pageable pageable = PageRequest.of(0, 10);
    Page<SystemLog> logPage = new PageImpl<>(Arrays.asList(systemLog), pageable, 1);

    SystemLogQueryRequest queryRequest = SystemLogQueryRequest.builder()
        .action("USER_LOGIN_SUCCESS")
        .build();

    when(systemLogRepository.findAll(isA(Specification.class), eq(pageable)))
        .thenReturn(logPage);

    Page<SystemLogResponse> result = systemLogService.getLogs(queryRequest, pageable);

    assertEquals(1, result.getTotalElements());
    verify(systemLogRepository, times(1))
        .findAll(isA(Specification.class), eq(pageable));
  }

  // test getLogsByAction should return logs by action
  @Test
  @DisplayName("getLogsByAction should return logs by action")
  void getLogsByAction_ShouldReturnLogs() {
    Pageable pageable = PageRequest.of(0, 10);
    Page<SystemLog> logPage = new PageImpl<>(Arrays.asList(systemLog), pageable, 1);

    when(systemLogRepository.findByActionOrderByCreatedAtDesc("USER_LOGIN_SUCCESS", pageable))
        .thenReturn(logPage);

    Page<SystemLogResponse> result = systemLogService.getLogsByAction("USER_LOGIN_SUCCESS", pageable);

    assertEquals(1, result.getTotalElements());
    verify(systemLogRepository, times(1))
        .findByActionOrderByCreatedAtDesc("USER_LOGIN_SUCCESS", pageable);
  }

  // test getLogsByUserId should return logs by user
  @Test
  @DisplayName("getLogsByUserId should return logs by user")
  void getLogsByUserId_ShouldReturnLogs() {
    Pageable pageable = PageRequest.of(0, 10);
    Page<SystemLog> logPage = new PageImpl<>(Arrays.asList(systemLog), pageable, 1);

    when(systemLogRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable))
        .thenReturn(logPage);

    Page<SystemLogResponse> result = systemLogService.getLogsByUserId(userId, pageable);

    assertEquals(1, result.getTotalElements());
    verify(systemLogRepository, times(1))
        .findByUserIdOrderByCreatedAtDesc(userId, pageable);
  }

  // test getLogsByDateRange should return logs in date range
  @Test
  @DisplayName("getLogsByDateRange should return logs in date range")
  void getLogsByDateRange_ShouldReturnLogs() {
    Pageable pageable = PageRequest.of(0, 10);
    Page<SystemLog> logPage = new PageImpl<>(Arrays.asList(systemLog), pageable, 1);

    Instant startDate = Instant.now().minusSeconds(3600);
    Instant endDate = Instant.now();

    when(systemLogRepository.findByDateRange(startDate, endDate, pageable))
        .thenReturn(logPage);

    Page<SystemLogResponse> result = systemLogService.getLogsByDateRange(startDate, endDate, pageable);

    assertEquals(1, result.getTotalElements());
    verify(systemLogRepository, times(1))
        .findByDateRange(startDate, endDate, pageable);
  }

  // test getLoginFailedAttempts should return failed login attempts
  @Test
  @DisplayName("getLoginFailedAttempts should return failed login attempts")
  void getLoginFailedAttempts_ShouldReturnFailedAttempts() {
    Pageable pageable = PageRequest.of(0, 10);
    Page<SystemLog> logPage = new PageImpl<>(Arrays.asList(systemLog), pageable, 1);

    Instant startDate = Instant.now().minusSeconds(3600);
    Instant endDate = Instant.now();

    when(systemLogRepository.findLoginFailedAttempts(startDate, endDate, pageable))
        .thenReturn(logPage);

    Page<SystemLogResponse> result = systemLogService.getLoginFailedAttempts(startDate, endDate, pageable);

    assertEquals(1, result.getTotalElements());
    verify(systemLogRepository, times(1))
        .findLoginFailedAttempts(startDate, endDate, pageable);
  }

  // test getLogById should return log
  @Test
  @DisplayName("getLogById should return log")
  void getLogById_ShouldReturnLog() {
    when(systemLogRepository.findById(logId)).thenReturn(Optional.of(systemLog));

    SystemLogResponse result = systemLogService.getLogById(logId);

    assertNotNull(result);
    assertEquals(logId, result.getId());
    verify(systemLogRepository, times(1)).findById(logId);
  }

  // test getLogById should throw exception when not found
  @Test
  @DisplayName("getLogById should throw exception when not found")
  void getLogById_ShouldThrowException_WhenNotFound() {
    UUID nonExistentId = UUID.randomUUID();
    when(systemLogRepository.findById(nonExistentId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> systemLogService.getLogById(nonExistentId));
  }

  // test getStatistics should return statistics
  @Test
  @DisplayName("getStatistics should return statistics")
  void getStatistics_ShouldReturnStatistics() {
    Instant startDate = Instant.now().minusSeconds(3600);
    Instant endDate = Instant.now();

    when(systemLogRepository.countByActionAndDateRange(any(String.class), eq(startDate), eq(endDate)))
        .thenReturn(10L);
    when(systemLogRepository.count()).thenReturn(100L);

    Map<String, Object> result = systemLogService.getStatistics(startDate, endDate);

    assertNotNull(result);
    assertNotNull(result.get("actionCounts"));
    assertNotNull(result.get("totalLogs"));
    verify(systemLogRepository, times(1)).count();
  }
}


