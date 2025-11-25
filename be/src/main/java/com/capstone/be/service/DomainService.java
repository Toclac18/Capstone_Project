package com.capstone.be.service;

import com.capstone.be.dto.response.resource.DomainWithSpecializationsResponse;
import java.util.List;
import java.util.UUID;

/**
 * Service interface for Domain and Specialization resources
 */
public interface DomainService {

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
}
