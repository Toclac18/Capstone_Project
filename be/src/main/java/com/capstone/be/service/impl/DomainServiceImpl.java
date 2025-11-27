package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.Domain;
import com.capstone.be.domain.entity.Specialization;
import com.capstone.be.dto.request.domain.CreateDomainRequest;
import com.capstone.be.dto.request.domain.UpdateDomainRequest;
import com.capstone.be.dto.response.domain.DomainDetailResponse;
import com.capstone.be.dto.response.resource.DomainResponse;
import com.capstone.be.dto.response.resource.DomainWithSpecializationsResponse;
import com.capstone.be.dto.response.resource.DomainWithSpecializationsResponse.SpecializationInfo;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.mapper.DomainMapper;
import com.capstone.be.repository.DomainRepository;
import com.capstone.be.repository.SpecializationRepository;
import com.capstone.be.repository.specification.DomainSpecification;
import com.capstone.be.service.DomainService;
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

@Slf4j
@Service
@RequiredArgsConstructor
public class DomainServiceImpl implements DomainService {

  private final DomainRepository domainRepository;
  private final SpecializationRepository specializationRepository;
  private final DomainMapper domainMapper;

  @Override
  public List<DomainResponse> getDomains() {
    log.info("Fetching all domains");

    List<Domain> domains = domainRepository.findAll();

    List<DomainResponse> response =
        domains.stream()
            .map(d -> DomainResponse.builder()
                .id(d.getId())
                .code(d.getCode())
                .name(d.getName())
                .build())
            .collect(Collectors.toList());

    log.info("Retrieved {} domains", response.size());
    return response;
  }

  @Override
  @Transactional(readOnly = true)
  public List<DomainWithSpecializationsResponse> getDomainsWithSpecializations() {
    log.info("Fetching all domains with specializations");

    List<Domain> domains = domainRepository.findAll();
    List<Specialization> allSpecializations = specializationRepository.findAll();

    Map<UUID, List<Specialization>> specializationsByDomain = allSpecializations.stream()
        .collect(Collectors.groupingBy(spec -> spec.getDomain().getId()));

    List<DomainWithSpecializationsResponse> response = domains.stream()
        .map(domain -> {
          List<Specialization> domainSpecs = specializationsByDomain.getOrDefault(domain.getId(),
              List.of());

          List<SpecializationInfo> specializationInfos = domainSpecs.stream()
              .map(spec -> SpecializationInfo.builder()
                  .id(spec.getId())
                  .code(spec.getCode())
                  .name(spec.getName())
                  .build())
              .toList();

          return DomainWithSpecializationsResponse.builder()
              .id(domain.getId())
              .code(domain.getCode())
              .name(domain.getName())
              .specializations(specializationInfos)
              .build();
        })
        .toList();

    log.info("Retrieved {} domains with specializations", response.size());
    return response;
  }

  @Override
  @Transactional(readOnly = true)
  public List<SpecializationInfo> getSpecializationsByDomain(UUID domainId) {
    log.info("Fetching specializations for domain: {}", domainId);

    if (!domainRepository.existsById(domainId)) {
      throw new ResourceNotFoundException("Domain", "id", domainId);
    }

    List<Specialization> specializations = specializationRepository.findByDomain_Id(domainId);

    List<SpecializationInfo> response = specializations.stream()
        .map(spec -> SpecializationInfo.builder()
            .id(spec.getId())
            .code(spec.getCode())
            .name(spec.getName())
            .build())
        .toList();

    log.info("Retrieved {} specializations for domain {}", response.size(), domainId);
    return response;
  }

  // ===== ADMIN METHODS =====

  @Override
  @Transactional(readOnly = true)
  public Page<DomainDetailResponse> getAllDomainsForAdmin(String name, Pageable pageable) {
    log.info("Admin fetching domains - name: {}, page: {}, size: {}",
        name, pageable.getPageNumber(), pageable.getPageSize());

    Specification<Domain> spec = DomainSpecification.withFilters(name);
    Page<Domain> domainPage = domainRepository.findAll(spec, pageable);

    log.info("Retrieved {} domains for admin", domainPage.getTotalElements());
    return domainPage.map(domainMapper::toDetailResponse);
  }

  @Override
  @Transactional(readOnly = true)
  public DomainDetailResponse getDomainById(UUID domainId) {
    log.info("Admin fetching domain by ID: {}", domainId);

    Domain domain = domainRepository.findById(domainId)
        .orElseThrow(() -> new ResourceNotFoundException("Domain", domainId));

    log.info("Retrieved domain: {}", domain.getName());
    return domainMapper.toDetailResponse(domain);
  }

  @Override
  @Transactional
  public DomainDetailResponse createDomain(CreateDomainRequest request) {
    log.info("Admin creating new domain: {}", request.getName());

    // Create new domain
    Domain domain = Domain.builder()
        .code(request.getCode())
        .name(request.getName())
        .build();

    domain = domainRepository.save(domain);

    log.info("Created domain with ID: {}", domain.getId());
    return domainMapper.toDetailResponse(domain);
  }

  @Override
  @Transactional
  public DomainDetailResponse updateDomain(UUID domainId, UpdateDomainRequest request) {
    log.info("Admin updating domain: {}", domainId);

    // Find existing domain
    Domain domain = domainRepository.findById(domainId)
        .orElseThrow(() -> new ResourceNotFoundException("Domain", domainId));

    // Update fields
    domain.setCode(request.getCode());
    domain.setName(request.getName());

    domain = domainRepository.save(domain);

    log.info("Updated domain: {}", domain.getName());
    return domainMapper.toDetailResponse(domain);
  }

  @Override
  @Transactional
  public void deleteDomain(UUID domainId) {
    log.info("Admin deleting domain: {}", domainId);

    // Find domain
    Domain domain = domainRepository.findById(domainId)
        .orElseThrow(() -> new ResourceNotFoundException("Domain", domainId));

    // TODO: Check if domain is used by any specializations or documents
    // If used, we might want to prevent deletion or soft delete

    domainRepository.delete(domain);

    log.info("Deleted domain: {}", domain.getName());
  }
}
