package com.capstone.be.service;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.OrganizationProfile;
import com.capstone.be.domain.entity.SystemLog;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.domain.enums.UserStatus;
import com.capstone.be.dto.response.statistics.SystemAdminDashboardResponse;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.OrganizationProfileRepository;
import com.capstone.be.repository.SystemLogRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.service.impl.SystemAdminStatisticsServiceImpl;
import java.time.Instant;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.jpa.domain.Specification;

@ExtendWith(MockitoExtension.class)
@DisplayName("SystemAdminStatisticsService Unit Tests")
class SystemAdminStatisticsServiceTest {

  @Mock
  private UserRepository userRepository;

  @Mock
  private OrganizationProfileRepository organizationProfileRepository;

  @Mock
  private DocumentRepository documentRepository;

  @Mock
  private SystemLogRepository systemLogRepository;

  @InjectMocks
  private SystemAdminStatisticsServiceImpl systemAdminStatisticsService;

  private Instant startDate;
  private Instant endDate;

  @BeforeEach
  void setUp() {
    startDate = Instant.now().minusSeconds(86400);
    endDate = Instant.now();
  }

  // test getDashboardStatistics should return dashboard statistics
  @Test
  @DisplayName("getDashboardStatistics should return dashboard statistics")
  void getDashboardStatistics_ShouldReturnStatistics() {
    when(userRepository.count()).thenReturn(100L);
    when(organizationProfileRepository.count()).thenReturn(10L);
    when(documentRepository.count()).thenReturn(50L);
    when(userRepository.count(any(Specification.class))).thenReturn(50L);
    when(systemLogRepository.findAll(any(Specification.class))).thenReturn(Arrays.asList());
    when(documentRepository.findAll(any(Specification.class))).thenReturn(Arrays.asList());

    SystemAdminDashboardResponse result =
        systemAdminStatisticsService.getDashboardStatistics(startDate, endDate);

    assertNotNull(result);
    verify(userRepository, times(1)).count();
  }

  // test getDashboardStatistics should return statistics with null dates
  @Test
  @DisplayName("getDashboardStatistics should return statistics with null dates")
  void getDashboardStatistics_ShouldReturnStatistics_WithNullDates() {
    when(userRepository.count()).thenReturn(100L);
    when(organizationProfileRepository.count()).thenReturn(10L);
    when(documentRepository.count()).thenReturn(50L);
    when(userRepository.count(any(Specification.class))).thenReturn(50L);
    when(systemLogRepository.findAll(any(Specification.class))).thenReturn(Arrays.asList());
    when(documentRepository.findAll(any(Specification.class))).thenReturn(Arrays.asList());

    SystemAdminDashboardResponse result =
        systemAdminStatisticsService.getDashboardStatistics(null, null);

    assertNotNull(result);
    verify(userRepository, times(1)).count();
  }
}

