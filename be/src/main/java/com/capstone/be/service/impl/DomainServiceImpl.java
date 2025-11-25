package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.Domain;
import com.capstone.be.domain.entity.Specialization;
import com.capstone.be.dto.response.resource.DomainWithSpecializationsResponse;
import com.capstone.be.dto.response.resource.DomainWithSpecializationsResponse.SpecializationInfo;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.repository.DomainRepository;
import com.capstone.be.repository.SpecializationRepository;
import com.capstone.be.service.DomainService;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class DomainServiceImpl implements DomainService {

  private final DomainRepository domainRepository;
  private final SpecializationRepository specializationRepository;

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
}
