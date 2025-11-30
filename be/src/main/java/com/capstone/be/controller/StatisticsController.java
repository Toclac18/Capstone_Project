package com.capstone.be.controller;

import com.capstone.be.dto.response.statistics.OrganizationStatisticsResponse;
import com.capstone.be.dto.response.statistics.PersonalDocumentStatisticsResponse;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.repository.OrganizationProfileRepository;
import com.capstone.be.security.model.UserPrincipal;
import com.capstone.be.service.OrganizationStatisticsService;
import com.capstone.be.service.PersonalStatisticsService;
import java.time.Instant;
import java.time.ZoneId;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for statistics operations
 */
@Slf4j
@RestController
@RequestMapping("/statistics")
@RequiredArgsConstructor
public class StatisticsController {

  private final PersonalStatisticsService personalStatisticsService;
  private final OrganizationStatisticsService organizationStatisticsService;
  private final OrganizationProfileRepository organizationProfileRepository;

  /**
   * Get personal document statistics (STA1)
   * GET /api/v1/statistics/personal
   *
   * @param userPrincipal Authenticated user
   * @param startDate     Optional start date filter (ISO format: yyyy-MM-dd)
   * @param endDate       Optional end date filter (ISO format: yyyy-MM-dd)
   * @return Personal document statistics response
   */
  @GetMapping("/personal")
  @PreAuthorize("hasRole('READER')")
  public ResponseEntity<PersonalDocumentStatisticsResponse> getPersonalStatistics(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) String startDate,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) String endDate) {
    UUID userId = userPrincipal.getId();
    
    Instant start = startDate != null 
        ? java.time.LocalDate.parse(startDate).atStartOfDay(ZoneId.systemDefault()).toInstant()
        : null;
    Instant end = endDate != null
        ? java.time.LocalDate.parse(endDate).atTime(23, 59, 59).atZone(ZoneId.systemDefault()).toInstant()
        : null;
    
    log.info("User {} requesting personal document statistics from {} to {}", userId, start, end);

    PersonalDocumentStatisticsResponse response = personalStatisticsService.getPersonalDocumentStatistics(
        userId, start, end);

    return ResponseEntity.ok(response);
  }

  /**
   * Get organization statistics for Organization Admin (STA3)
   * GET /api/statistics/organization
   *
   * @param userPrincipal Authenticated organization admin
   * @param startDate     Optional start date filter (ISO format: yyyy-MM-dd)
   * @param endDate       Optional end date filter (ISO format: yyyy-MM-dd)
   * @return Organization statistics response
   */
  @GetMapping("/organization")
  @PreAuthorize("hasRole('ORGANIZATION_ADMIN')")
  public ResponseEntity<OrganizationStatisticsResponse> getMyOrganizationStatistics(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) String startDate,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) String endDate) {
    UUID adminId = userPrincipal.getId();

    // Get organization by admin ID
    UUID organizationId = organizationProfileRepository.findByAdminId(adminId)
        .orElseThrow(() -> new ResourceNotFoundException(
            "Organization not found for admin ID: " + adminId))
        .getId();

    Instant start = startDate != null
        ? java.time.LocalDate.parse(startDate).atStartOfDay(ZoneId.systemDefault()).toInstant()
        : null;
    Instant end = endDate != null
        ? java.time.LocalDate.parse(endDate).atTime(23, 59, 59).atZone(ZoneId.systemDefault())
            .toInstant()
        : null;

    log.info("Organization admin {} requesting statistics for organization {} from {} to {}",
        adminId, organizationId, start, end);

    OrganizationStatisticsResponse response = organizationStatisticsService.getOrganizationStatistics(
        organizationId, start, end);

    return ResponseEntity.ok(response);
  }

  /**
   * Get organization statistics for Business Admin (STA6)
   * GET /api/statistics/organization/{organizationId}
   *
   * @param userPrincipal   Authenticated business admin
   * @param organizationId  Organization ID
   * @param startDate       Optional start date filter (ISO format: yyyy-MM-dd)
   * @param endDate         Optional end date filter (ISO format: yyyy-MM-dd)
   * @return Organization statistics response
   */
  @GetMapping("/organization/{organizationId}")
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  public ResponseEntity<OrganizationStatisticsResponse> getOrganizationStatistics(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @PathVariable UUID organizationId,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) String startDate,
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) String endDate) {
    UUID adminId = userPrincipal.getId();

    Instant start = startDate != null
        ? java.time.LocalDate.parse(startDate).atStartOfDay(ZoneId.systemDefault()).toInstant()
        : null;
    Instant end = endDate != null
        ? java.time.LocalDate.parse(endDate).atTime(23, 59, 59).atZone(ZoneId.systemDefault())
            .toInstant()
        : null;

    log.info("Business admin {} requesting statistics for organization {} from {} to {}",
        adminId, organizationId, start, end);

    OrganizationStatisticsResponse response = organizationStatisticsService.getOrganizationStatistics(
        organizationId, start, end);

    return ResponseEntity.ok(response);
  }
}

