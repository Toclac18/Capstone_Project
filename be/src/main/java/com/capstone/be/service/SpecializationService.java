package com.capstone.be.service;

import com.capstone.be.dto.request.specialization.CreateSpecializationRequest;
import com.capstone.be.dto.request.specialization.UpdateSpecializationRequest;
import com.capstone.be.dto.response.specialization.SpecializationDetailResponse;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service for Specialization management
 */
public interface SpecializationService {

  /**
   * Get all specializations (paginated)
   * For Business Admin
   *
   * @param domainId Filter by domain ID (optional)
   * @param name     Filter by name (optional)
   * @param pageable Pagination parameters
   * @return Page of SpecializationDetailResponse
   */
  Page<SpecializationDetailResponse> getAllSpecializations(UUID domainId, String name,
      Pageable pageable);

  /**
   * Get specialization by ID
   * For Business Admin
   *
   * @param specializationId Specialization ID
   * @return SpecializationDetailResponse
   */
  SpecializationDetailResponse getSpecializationById(UUID specializationId);

  /**
   * Create a new specialization
   * For Business Admin
   *
   * @param request CreateSpecializationRequest
   * @return Created SpecializationDetailResponse
   */
  SpecializationDetailResponse createSpecialization(CreateSpecializationRequest request);

  /**
   * Update an existing specialization
   * For Business Admin
   *
   * @param specializationId Specialization ID (from path parameter)
   * @param request          UpdateSpecializationRequest
   * @return Updated SpecializationDetailResponse
   */
  SpecializationDetailResponse updateSpecialization(UUID specializationId,
      UpdateSpecializationRequest request);

  /**
   * Delete a specialization
   * For Business Admin
   *
   * @param specializationId Specialization ID
   */
  void deleteSpecialization(UUID specializationId);
}
