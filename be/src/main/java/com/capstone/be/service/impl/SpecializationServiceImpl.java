package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.Domain;
import com.capstone.be.domain.entity.Specialization;
import com.capstone.be.dto.request.specialization.CreateSpecializationRequest;
import com.capstone.be.dto.request.specialization.UpdateSpecializationRequest;
import com.capstone.be.dto.response.specialization.SpecializationDetailResponse;
import com.capstone.be.exception.DuplicateResourceException;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.mapper.SpecializationMapper;
import com.capstone.be.repository.DomainRepository;
import com.capstone.be.repository.SpecializationRepository;
import com.capstone.be.repository.specification.SpecializationSpecification;
import com.capstone.be.service.SpecializationService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SpecializationServiceImpl implements SpecializationService {

  private final SpecializationRepository specializationRepository;
  private final DomainRepository domainRepository;
  private final SpecializationMapper specializationMapper;

  @Override
  @Transactional(readOnly = true)
  public Page<SpecializationDetailResponse> getAllSpecializations(UUID domainId, String name,
      Pageable pageable) {
    log.info("Admin fetching specializations - domainId: {}, name: {}, page: {}, size: {}",
        domainId, name, pageable.getPageNumber(), pageable.getPageSize());

    Specification<Specialization> spec = SpecializationSpecification.withFilters(domainId, name);
    Page<Specialization> specializationPage = specializationRepository.findAll(spec, pageable);

    log.info("Retrieved {} specializations for admin", specializationPage.getTotalElements());
    return specializationPage.map(specializationMapper::toDetailResponse);
  }

  @Override
  @Transactional(readOnly = true)
  public SpecializationDetailResponse getSpecializationById(UUID specializationId) {
    log.info("Admin fetching specialization by ID: {}", specializationId);

    Specialization specialization = specializationRepository.findById(specializationId)
        .orElseThrow(() -> new ResourceNotFoundException("Specialization", specializationId));

    log.info("Retrieved specialization: {}", specialization.getName());
    return specializationMapper.toDetailResponse(specialization);
  }

  @Override
  @Transactional
  public SpecializationDetailResponse createSpecialization(CreateSpecializationRequest request) {
    log.info("Admin creating new specialization: {} for domain: {}", request.getName(),
        request.getDomainId());

    // Find domain
    Domain domain = domainRepository.findById(request.getDomainId())
        .orElseThrow(() -> new ResourceNotFoundException("Domain", request.getDomainId()));

    // Check for duplicate code (optional - depends on business rules)
    // For now, we allow duplicate codes across different domains

    // Create new specialization
    Specialization specialization = Specialization.builder()
        .code(request.getCode())
        .name(request.getName())
        .domain(domain)
        .build();

    specialization = specializationRepository.save(specialization);

    log.info("Created specialization with ID: {}", specialization.getId());
    return specializationMapper.toDetailResponse(specialization);
  }

  @Override
  @Transactional
  public SpecializationDetailResponse updateSpecialization(UUID specializationId,
      UpdateSpecializationRequest request) {
    log.info("Admin updating specialization: {}", specializationId);

    // Find existing specialization
    Specialization specialization = specializationRepository.findById(specializationId)
        .orElseThrow(() -> new ResourceNotFoundException("Specialization", specializationId));

    // Find domain if changed
    if (request.getDomainId() != null &&
        !specialization.getDomain().getId().equals(request.getDomainId())) {

      Domain domain = domainRepository.findById(request.getDomainId())
          .orElseThrow(() -> new ResourceNotFoundException("Domain", request.getDomainId()));

      specialization.setDomain(domain);
    }

    // Update code
    if (request.getCode() != null) {
      specialization.setCode(request.getCode());
    }

    // Update name
    if (request.getName() != null && !request.getName().isBlank()) {
      specialization.setName(request.getName());
    }

    specialization = specializationRepository.save(specialization);

    log.info("Updated specialization: {}", specialization.getName());
    return specializationMapper.toDetailResponse(specialization);
  }

  @Override
  @Transactional
  public void deleteSpecialization(UUID specializationId) {
    log.info("Admin deleting specialization: {}", specializationId);

    // Find specialization
    Specialization specialization = specializationRepository.findById(specializationId)
        .orElseThrow(() -> new ResourceNotFoundException("Specialization", specializationId));

    // TODO: Check if specialization is used by any documents or reviewers
    // If used, we might want to prevent deletion or soft delete

    specializationRepository.delete(specialization);

    log.info("Deleted specialization: {}", specialization.getName());
  }
}
