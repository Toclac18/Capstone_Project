package com.capstone.be.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isA;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.capstone.be.domain.entity.Domain;
import com.capstone.be.domain.entity.Specialization;
import com.capstone.be.dto.request.domain.CreateDomainRequest;
import com.capstone.be.dto.request.domain.UpdateDomainRequest;
import com.capstone.be.dto.response.domain.DomainDetailResponse;
import com.capstone.be.dto.response.resource.DomainResponse;
import com.capstone.be.dto.response.resource.DomainWithSpecializationsResponse;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.mapper.DomainMapper;
import com.capstone.be.repository.DomainRepository;
import com.capstone.be.repository.SpecializationRepository;
import com.capstone.be.service.impl.DomainServiceImpl;
import java.time.Instant;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
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
@DisplayName("DomainService Unit Tests")
class DomainServiceTest {

  @Mock
  private DomainRepository domainRepository;

  @Mock
  private SpecializationRepository specializationRepository;

  @Mock
  private DomainMapper domainMapper;

  @InjectMocks
  private DomainServiceImpl domainService;

  private Domain domain1;
  private Domain domain2;
  private UUID domainId1;
  private UUID domainId2;
  private Specialization specialization1;
  private Specialization specialization2;

  @BeforeEach
  void setUp() {
    domainId1 = UUID.randomUUID();
    domainId2 = UUID.randomUUID();
    UUID specId1 = UUID.randomUUID();
    UUID specId2 = UUID.randomUUID();

    domain1 = Domain.builder()
        .id(domainId1)
        .code(1)
        .name("Computer Science")
        .createdAt(Instant.now())
        .updatedAt(Instant.now())
        .build();

    domain2 = Domain.builder()
        .id(domainId2)
        .code(2)
        .name("Mathematics")
        .createdAt(Instant.now())
        .updatedAt(Instant.now())
        .build();

    specialization1 = Specialization.builder()
        .id(specId1)
        .code(101)
        .name("Software Engineering")
        .domain(domain1)
        .build();

    specialization2 = Specialization.builder()
        .id(specId2)
        .code(102)
        .name("Data Science")
        .domain(domain1)
        .build();
  }

  @Test
  @DisplayName("getDomains should return all domains")
  void getDomains_ShouldReturnAllDomains() {
    List<Domain> domains = Arrays.asList(domain1, domain2);
    when(domainRepository.findAll()).thenReturn(domains);

    List<DomainResponse> result = domainService.getDomains();

    assertNotNull(result);
    assertEquals(2, result.size());
    assertEquals(domainId1, result.get(0).getId());
    assertEquals("Computer Science", result.get(0).getName());
    verify(domainRepository, times(1)).findAll();
  }

  @Test
  @DisplayName("getDomains should return empty list when no domains")
  void getDomains_ShouldReturnEmptyList() {
    when(domainRepository.findAll()).thenReturn(Collections.emptyList());

    List<DomainResponse> result = domainService.getDomains();

    assertNotNull(result);
    assertTrue(result.isEmpty());
    verify(domainRepository, times(1)).findAll();
  }

  @Test
  @DisplayName("getDomainsWithSpecializations should return domains with specializations")
  void getDomainsWithSpecializations_ShouldReturnDomainsWithSpecializations() {
    List<Domain> domains = Arrays.asList(domain1, domain2);
    List<Specialization> specializations = Arrays.asList(specialization1, specialization2);

    when(domainRepository.findAll()).thenReturn(domains);
    when(specializationRepository.findAll()).thenReturn(specializations);

    List<DomainWithSpecializationsResponse> result = domainService.getDomainsWithSpecializations();

    assertNotNull(result);
    assertEquals(2, result.size());
    DomainWithSpecializationsResponse domain1Response = result.stream()
        .filter(d -> d.getId().equals(domainId1))
        .findFirst()
        .orElse(null);
    assertNotNull(domain1Response);
    assertEquals(2, domain1Response.getSpecializations().size());
    verify(domainRepository, times(1)).findAll();
    verify(specializationRepository, times(1)).findAll();
  }

  @Test
  @DisplayName("getSpecializationsByDomain should return specializations")
  void getSpecializationsByDomain_ShouldReturnSpecializations() {
    List<Specialization> specializations = Arrays.asList(specialization1, specialization2);
    when(domainRepository.existsById(domainId1)).thenReturn(true);
    when(specializationRepository.findByDomain_Id(domainId1)).thenReturn(specializations);

    List<DomainWithSpecializationsResponse.SpecializationInfo> result =
        domainService.getSpecializationsByDomain(domainId1);

    assertNotNull(result);
    assertEquals(2, result.size());
    verify(domainRepository, times(1)).existsById(domainId1);
  }

  @Test
  @DisplayName("getSpecializationsByDomain should throw exception when domain not found")
  void getSpecializationsByDomain_ShouldThrowException_WhenNotFound() {
    UUID nonExistentId = UUID.randomUUID();
    when(domainRepository.existsById(nonExistentId)).thenReturn(false);

    assertThrows(ResourceNotFoundException.class,
        () -> domainService.getSpecializationsByDomain(nonExistentId));
    verify(specializationRepository, never()).findByDomain_Id(any());
  }

  @Test
  @DisplayName("getAllDomainsForAdmin should return paginated domains")
  void getAllDomainsForAdmin_ShouldReturnPaginatedDomains() {
    Pageable pageable = PageRequest.of(0, 10);
    List<Domain> domains = Arrays.asList(domain1, domain2);
    Page<Domain> domainPage = new PageImpl<>(domains, pageable, 2);

    DomainDetailResponse response1 = DomainDetailResponse.builder()
        .id(domainId1)
        .code(1)
        .name("Computer Science")
        .build();
    DomainDetailResponse response2 = DomainDetailResponse.builder()
        .id(domainId2)
        .code(2)
        .name("Mathematics")
        .build();

    when(domainRepository.findAll(isA(Specification.class), eq(pageable))).thenReturn(domainPage);
    when(domainMapper.toDetailResponse(domain1)).thenReturn(response1);
    when(domainMapper.toDetailResponse(domain2)).thenReturn(response2);

    Page<DomainDetailResponse> result = domainService.getAllDomainsForAdmin(null, pageable);

    assertNotNull(result);
    assertEquals(2, result.getTotalElements());
    verify(domainRepository, times(1)).findAll(isA(Specification.class), eq(pageable));
  }

  @Test
  @DisplayName("getAllDomainsForAdmin should filter by name")
  void getAllDomainsForAdmin_ShouldFilterByName() {
    Pageable pageable = PageRequest.of(0, 10);
    String nameFilter = "Computer";
    List<Domain> filteredDomains = Collections.singletonList(domain1);
    Page<Domain> domainPage = new PageImpl<>(filteredDomains, pageable, 1);

    DomainDetailResponse response1 = DomainDetailResponse.builder()
        .id(domainId1)
        .code(1)
        .name("Computer Science")
        .build();

    when(domainRepository.findAll(isA(Specification.class), eq(pageable))).thenReturn(domainPage);
    when(domainMapper.toDetailResponse(domain1)).thenReturn(response1);

    Page<DomainDetailResponse> result = domainService.getAllDomainsForAdmin(nameFilter, pageable);

    assertEquals(1, result.getTotalElements());
    assertEquals("Computer Science", result.getContent().get(0).getName());
  }

  @Test
  @DisplayName("getDomainById should return domain when exists")
  void getDomainById_ShouldReturnDomain() {
    DomainDetailResponse expectedResponse = DomainDetailResponse.builder()
        .id(domainId1)
        .code(1)
        .name("Computer Science")
        .build();

    when(domainRepository.findById(domainId1)).thenReturn(Optional.of(domain1));
    when(domainMapper.toDetailResponse(domain1)).thenReturn(expectedResponse);

    DomainDetailResponse result = domainService.getDomainById(domainId1);

    assertNotNull(result);
    assertEquals(domainId1, result.getId());
    assertEquals("Computer Science", result.getName());
    verify(domainRepository, times(1)).findById(domainId1);
  }

  @Test
  @DisplayName("getDomainById should throw exception when not found")
  void getDomainById_ShouldThrowException_WhenNotFound() {
    UUID nonExistentId = UUID.randomUUID();
    when(domainRepository.findById(nonExistentId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> domainService.getDomainById(nonExistentId));
    verify(domainMapper, never()).toDetailResponse(any());
  }

  @Test
  @DisplayName("createDomain should create new domain")
  void createDomain_ShouldCreateDomain() {
    CreateDomainRequest request = CreateDomainRequest.builder()
        .code(3)
        .name("Physics")
        .build();

    Domain newDomain = Domain.builder()
        .id(UUID.randomUUID())
        .code(3)
        .name("Physics")
        .createdAt(Instant.now())
        .updatedAt(Instant.now())
        .build();

    DomainDetailResponse expectedResponse = DomainDetailResponse.builder()
        .id(newDomain.getId())
        .code(3)
        .name("Physics")
        .build();

    when(domainRepository.save(any(Domain.class))).thenReturn(newDomain);
    when(domainMapper.toDetailResponse(newDomain)).thenReturn(expectedResponse);

    DomainDetailResponse result = domainService.createDomain(request);

    assertNotNull(result);
    assertEquals(3, result.getCode());
    assertEquals("Physics", result.getName());
    verify(domainRepository, times(1)).save(any(Domain.class));
  }

  @Test
  @DisplayName("updateDomain should update domain with all fields")
  void updateDomain_ShouldUpdateDomain_WithAllFields() {
    UpdateDomainRequest request = UpdateDomainRequest.builder()
        .code(10)
        .name("Updated Computer Science")
        .build();

    Domain updatedDomain = Domain.builder()
        .id(domainId1)
        .code(10)
        .name("Updated Computer Science")
        .build();

    DomainDetailResponse expectedResponse = DomainDetailResponse.builder()
        .id(domainId1)
        .code(10)
        .name("Updated Computer Science")
        .build();

    when(domainRepository.findById(domainId1)).thenReturn(Optional.of(domain1));
    when(domainRepository.save(any(Domain.class))).thenReturn(updatedDomain);
    when(domainMapper.toDetailResponse(updatedDomain)).thenReturn(expectedResponse);

    DomainDetailResponse result = domainService.updateDomain(domainId1, request);

    assertEquals(10, result.getCode());
    assertEquals("Updated Computer Science", result.getName());
    verify(domainRepository, times(1)).save(any(Domain.class));
  }

  @Test
  @DisplayName("updateDomain should update only code when name is null")
  void updateDomain_ShouldUpdateOnlyCode() {
    UpdateDomainRequest request = UpdateDomainRequest.builder()
        .code(20)
        .name(null)
        .build();

    Domain updatedDomain = Domain.builder()
        .id(domainId1)
        .code(20)
        .name("Computer Science")
        .build();

    DomainDetailResponse expectedResponse = DomainDetailResponse.builder()
        .id(domainId1)
        .code(20)
        .name("Computer Science")
        .build();

    when(domainRepository.findById(domainId1)).thenReturn(Optional.of(domain1));
    when(domainRepository.save(any(Domain.class))).thenReturn(updatedDomain);
    when(domainMapper.toDetailResponse(updatedDomain)).thenReturn(expectedResponse);

    DomainDetailResponse result = domainService.updateDomain(domainId1, request);

    assertEquals(20, result.getCode());
    assertEquals("Computer Science", result.getName());
  }

  @Test
  @DisplayName("updateDomain should not update code when invalid")
  void updateDomain_ShouldNotUpdateCode_WhenInvalid() {
    UpdateDomainRequest request = UpdateDomainRequest.builder()
        .code(0)
        .name("New Name")
        .build();

    Domain updatedDomain = Domain.builder()
        .id(domainId1)
        .code(1)
        .name("New Name")
        .build();

    DomainDetailResponse expectedResponse = DomainDetailResponse.builder()
        .id(domainId1)
        .code(1)
        .name("New Name")
        .build();

    when(domainRepository.findById(domainId1)).thenReturn(Optional.of(domain1));
    when(domainRepository.save(any(Domain.class))).thenReturn(updatedDomain);
    when(domainMapper.toDetailResponse(updatedDomain)).thenReturn(expectedResponse);

    DomainDetailResponse result = domainService.updateDomain(domainId1, request);

    assertEquals(1, result.getCode());
    assertEquals("New Name", result.getName());
  }

  @Test
  @DisplayName("updateDomain should throw exception when not found")
  void updateDomain_ShouldThrowException_WhenNotFound() {
    UUID nonExistentId = UUID.randomUUID();
    UpdateDomainRequest request = UpdateDomainRequest.builder()
        .code(10)
        .name("Updated Name")
        .build();

    when(domainRepository.findById(nonExistentId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> domainService.updateDomain(nonExistentId, request));
    verify(domainRepository, never()).save(any());
  }

  @Test
  @DisplayName("deleteDomain should delete domain")
  void deleteDomain_ShouldDeleteDomain() {
    when(domainRepository.findById(domainId1)).thenReturn(Optional.of(domain1));

    domainService.deleteDomain(domainId1);

    verify(domainRepository, times(1)).findById(domainId1);
    verify(domainRepository, times(1)).delete(domain1);
  }

  @Test
  @DisplayName("deleteDomain should throw exception when not found")
  void deleteDomain_ShouldThrowException_WhenNotFound() {
    UUID nonExistentId = UUID.randomUUID();
    when(domainRepository.findById(nonExistentId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> domainService.deleteDomain(nonExistentId));
    verify(domainRepository, never()).delete(any(Domain.class));
  }
}

