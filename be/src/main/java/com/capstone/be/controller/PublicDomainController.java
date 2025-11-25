package com.capstone.be.controller;

import com.capstone.be.dto.response.resource.DomainWithSpecializationsResponse;
import com.capstone.be.dto.response.resource.DomainWithSpecializationsResponse.SpecializationInfo;
import com.capstone.be.service.DomainService;
import java.util.List;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Public controller for Domain and Specialization resources
 * No authentication required
 */
@Slf4j
@RestController
@RequestMapping("/public/domains")
@RequiredArgsConstructor
public class PublicDomainController {

  private final DomainService domainService;

  /**
   * Get all domains with their specializations
   * Public endpoint - no authentication required
   * Returns nested structure: Domain -> Specializations
   *
   * @return List of domains with nested specializations
   */
  @GetMapping
  public ResponseEntity<List<DomainWithSpecializationsResponse>> getDomainsWithSpecializations() {
    log.info("Public request for all domains with specializations");

    List<DomainWithSpecializationsResponse> response = domainService.getDomainsWithSpecializations();

    log.info("Retrieved {} domains with specializations", response.size());
    return ResponseEntity.ok(response);
  }

  /**
   * Get specializations by domain
   * Public endpoint - no authentication required
   *
   * @param domainId Domain ID
   * @return List of specializations for the domain
   */
  @GetMapping(value = "/{domainId}/specializations")
  public ResponseEntity<List<SpecializationInfo>> getSpecializationsByDomain(
      @PathVariable(name = "domainId") UUID domainId) {
    log.info("Public request for specializations in domain: {}", domainId);

    List<SpecializationInfo> specializations = domainService.getSpecializationsByDomain(domainId);

    log.info("Retrieved {} specializations for domain {}", specializations.size(), domainId);
    return ResponseEntity.ok(specializations);
  }
}
