package com.capstone.be.service;

import com.capstone.be.dto.request.domain.CreateDomainRequest;
import com.capstone.be.dto.request.domain.UpdateDomainRequest;
import com.capstone.be.dto.response.domain.DomainDetailResponse;
import com.capstone.be.dto.response.resource.DomainResponse;
import com.capstone.be.dto.response.resource.DomainWithSpecializationsResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service interface for Domain and Specialization resources
 */
public interface DomainService {

  /**
   * Get all domains
   *
   * @return List of domains with
   */
  List<DomainResponse> getDomains();


  /**
   * Get all domains with their specializations
   *
   * @return List of domains with nested specializations
   */
  List<DomainWithSpecializationsResponse> getDomainsWithSpecializations();

  /**
   * Get specializations by domain ID
   *
   * @param domainId Domain ID
   * @return List of specialization info
   */
  List<DomainWithSpecializationsResponse.SpecializationInfo> getSpecializationsByDomain(
      UUID domainId);

  // ===== ADMIN METHODS =====

  /**
   * Get all domains (paginated) For Business Admin
   *
   * @param name     Filter by name (optional)
   * @param dateFrom Filter by creation date from (optional)
   * @param dateTo   Filter by creation date to (optional)
   * @param pageable Pagination parameters
   * @return Page of DomainDetailResponse
   */
  Page<DomainDetailResponse> getAllDomainsForAdmin(String name, java.time.Instant dateFrom, java.time.Instant dateTo, Pageable pageable);

  /**
   * Get domain by ID For Business Admin
   *
   * @param domainId Domain ID
   * @return DomainDetailResponse
   */
  DomainDetailResponse getDomainById(UUID domainId);

  /**
   * Create a new domain For Business Admin
   *
   * @param request CreateDomainRequest
   * @return Created DomainDetailResponse
   */
  DomainDetailResponse createDomain(CreateDomainRequest request);

  /**
   * Update an existing domain For Business Admin
   *
   * @param domainId Domain ID (from path parameter)
   * @param request  UpdateDomainRequest
   * @return Updated DomainDetailResponse
   */
  DomainDetailResponse updateDomain(UUID domainId, UpdateDomainRequest request);

  /**
   * Delete a domain For Business Admin
   *
   * @param domainId Domain ID
   */
  void deleteDomain(UUID domainId);
}
