package com.capstone.be.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isA;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.capstone.be.domain.entity.Domain;
import com.capstone.be.domain.entity.Specialization;
import com.capstone.be.dto.request.specialization.CreateSpecializationRequest;
import com.capstone.be.dto.request.specialization.UpdateSpecializationRequest;
import com.capstone.be.dto.response.specialization.SpecializationDetailResponse;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.mapper.SpecializationMapper;
import com.capstone.be.repository.DomainRepository;
import com.capstone.be.repository.SpecializationRepository;
import com.capstone.be.service.impl.SpecializationServiceImpl;
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
@DisplayName("SpecializationService Unit Tests")
class SpecializationServiceTest {

  @Mock
  private SpecializationRepository specializationRepository;

  @Mock
  private DomainRepository domainRepository;

  @Mock
  private SpecializationMapper specializationMapper;

  @InjectMocks
  private SpecializationServiceImpl specializationService;

  private Domain domain1;
  private Domain domain2;
  private Specialization specialization1;
  private Specialization specialization2;
  private UUID domainId1;
  private UUID domainId2;
  private UUID specializationId1;
  private UUID specializationId2;

  @BeforeEach
  void setUp() {
    domainId1 = UUID.randomUUID();
    domainId2 = UUID.randomUUID();
    specializationId1 = UUID.randomUUID();
    specializationId2 = UUID.randomUUID();

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
        .id(specializationId1)
        .code(101)
        .name("Software Engineering")
        .domain(domain1)
        .createdAt(Instant.now())
        .updatedAt(Instant.now())
        .build();

    specialization2 = Specialization.builder()
        .id(specializationId2)
        .code(102)
        .name("Data Science")
        .domain(domain1)
        .createdAt(Instant.now())
        .updatedAt(Instant.now())
        .build();
  }

  @Test
  @DisplayName("getAllSpecializations should return paginated specializations")
  void getAllSpecializations_ShouldReturnPaginatedSpecializations() {
    Pageable pageable = PageRequest.of(0, 10);
    List<Specialization> specializations = Arrays.asList(specialization1, specialization2);
    Page<Specialization> specializationPage = new PageImpl<>(specializations, pageable, 2);

    SpecializationDetailResponse response1 = SpecializationDetailResponse.builder()
        .id(specializationId1)
        .code(101)
        .name("Software Engineering")
        .build();
    SpecializationDetailResponse response2 = SpecializationDetailResponse.builder()
        .id(specializationId2)
        .code(102)
        .name("Data Science")
        .build();

    when(specializationRepository.findAll(isA(Specification.class), eq(pageable)))
        .thenReturn(specializationPage);
    when(specializationMapper.toDetailResponse(specialization1)).thenReturn(response1);
    when(specializationMapper.toDetailResponse(specialization2)).thenReturn(response2);

    Page<SpecializationDetailResponse> result =
        specializationService.getAllSpecializations(null, null, pageable);

    assertNotNull(result);
    assertEquals(2, result.getTotalElements());
    verify(specializationRepository, times(1))
        .findAll(isA(Specification.class), eq(pageable));
  }

  @Test
  @DisplayName("getAllSpecializations should filter by domain")
  void getAllSpecializations_ShouldFilterByDomain() {
    Pageable pageable = PageRequest.of(0, 10);
    List<Specialization> filteredSpecializations = Collections.singletonList(specialization1);
    Page<Specialization> specializationPage = new PageImpl<>(filteredSpecializations, pageable, 1);

    SpecializationDetailResponse response1 = SpecializationDetailResponse.builder()
        .id(specializationId1)
        .code(101)
        .name("Software Engineering")
        .build();

    when(specializationRepository.findAll(isA(Specification.class), eq(pageable)))
        .thenReturn(specializationPage);
    when(specializationMapper.toDetailResponse(specialization1)).thenReturn(response1);

    Page<SpecializationDetailResponse> result =
        specializationService.getAllSpecializations(domainId1, null, pageable);

    assertEquals(1, result.getTotalElements());
    assertEquals("Software Engineering", result.getContent().get(0).getName());
  }

  @Test
  @DisplayName("getAllSpecializations should filter by name")
  void getAllSpecializations_ShouldFilterByName() {
    Pageable pageable = PageRequest.of(0, 10);
    String nameFilter = "Software";
    List<Specialization> filteredSpecializations = Collections.singletonList(specialization1);
    Page<Specialization> specializationPage = new PageImpl<>(filteredSpecializations, pageable, 1);

    SpecializationDetailResponse response1 = SpecializationDetailResponse.builder()
        .id(specializationId1)
        .code(101)
        .name("Software Engineering")
        .build();

    when(specializationRepository.findAll(isA(Specification.class), eq(pageable)))
        .thenReturn(specializationPage);
    when(specializationMapper.toDetailResponse(specialization1)).thenReturn(response1);

    Page<SpecializationDetailResponse> result =
        specializationService.getAllSpecializations(null, nameFilter, pageable);

    assertEquals(1, result.getTotalElements());
    assertEquals("Software Engineering", result.getContent().get(0).getName());
  }

  @Test
  @DisplayName("getSpecializationById should return specialization when exists")
  void getSpecializationById_ShouldReturnSpecialization() {
    SpecializationDetailResponse expectedResponse = SpecializationDetailResponse.builder()
        .id(specializationId1)
        .code(101)
        .name("Software Engineering")
        .build();

    when(specializationRepository.findById(specializationId1))
        .thenReturn(Optional.of(specialization1));
    when(specializationMapper.toDetailResponse(specialization1)).thenReturn(expectedResponse);

    SpecializationDetailResponse result =
        specializationService.getSpecializationById(specializationId1);

    assertNotNull(result);
    assertEquals(specializationId1, result.getId());
    assertEquals("Software Engineering", result.getName());
    verify(specializationRepository, times(1)).findById(specializationId1);
  }

  @Test
  @DisplayName("getSpecializationById should throw exception when not found")
  void getSpecializationById_ShouldThrowException_WhenNotFound() {
    UUID nonExistentId = UUID.randomUUID();
    when(specializationRepository.findById(nonExistentId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> specializationService.getSpecializationById(nonExistentId));
    verify(specializationMapper, never()).toDetailResponse(any());
  }

  @Test
  @DisplayName("createSpecialization should create new specialization")
  void createSpecialization_ShouldCreateSpecialization() {
    CreateSpecializationRequest request = CreateSpecializationRequest.builder()
        .code(103)
        .name("Machine Learning")
        .domainId(domainId1)
        .build();

    Specialization newSpecialization = Specialization.builder()
        .id(UUID.randomUUID())
        .code(103)
        .name("Machine Learning")
        .domain(domain1)
        .createdAt(Instant.now())
        .updatedAt(Instant.now())
        .build();

    SpecializationDetailResponse expectedResponse = SpecializationDetailResponse.builder()
        .id(newSpecialization.getId())
        .code(103)
        .name("Machine Learning")
        .build();

    when(domainRepository.findById(domainId1)).thenReturn(Optional.of(domain1));
    when(specializationRepository.save(any(Specialization.class))).thenReturn(newSpecialization);
    when(specializationMapper.toDetailResponse(newSpecialization)).thenReturn(expectedResponse);

    SpecializationDetailResponse result = specializationService.createSpecialization(request);

    assertNotNull(result);
    assertEquals(103, result.getCode());
    assertEquals("Machine Learning", result.getName());
    verify(specializationRepository, times(1)).save(any(Specialization.class));
  }

  @Test
  @DisplayName("createSpecialization should throw exception when domain not found")
  void createSpecialization_ShouldThrowException_WhenDomainNotFound() {
    UUID nonExistentDomainId = UUID.randomUUID();
    CreateSpecializationRequest request = CreateSpecializationRequest.builder()
        .code(103)
        .name("Machine Learning")
        .domainId(nonExistentDomainId)
        .build();

    when(domainRepository.findById(nonExistentDomainId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> specializationService.createSpecialization(request));
    verify(specializationRepository, never()).save(any());
  }

  @Test
  @DisplayName("updateSpecialization should update specialization")
  void updateSpecialization_ShouldUpdateSpecialization() {
    UpdateSpecializationRequest request = UpdateSpecializationRequest.builder()
        .code(110)
        .name("Updated Software Engineering")
        .domainId(null)
        .build();

    Specialization updatedSpecialization = Specialization.builder()
        .id(specializationId1)
        .code(110)
        .name("Updated Software Engineering")
        .domain(domain1)
        .build();

    SpecializationDetailResponse expectedResponse = SpecializationDetailResponse.builder()
        .id(specializationId1)
        .code(110)
        .name("Updated Software Engineering")
        .build();

    when(specializationRepository.findById(specializationId1))
        .thenReturn(Optional.of(specialization1));
    when(specializationRepository.save(any(Specialization.class))).thenReturn(updatedSpecialization);
    when(specializationMapper.toDetailResponse(updatedSpecialization)).thenReturn(expectedResponse);

    SpecializationDetailResponse result =
        specializationService.updateSpecialization(specializationId1, request);

    assertEquals(110, result.getCode());
    assertEquals("Updated Software Engineering", result.getName());
    verify(specializationRepository, times(1)).save(any(Specialization.class));
  }

  @Test
  @DisplayName("updateSpecialization should update domain when changed")
  void updateSpecialization_ShouldUpdateDomain() {
    UpdateSpecializationRequest request = UpdateSpecializationRequest.builder()
        .code(101)
        .name("Software Engineering")
        .domainId(domainId2)
        .build();

    Specialization updatedSpecialization = Specialization.builder()
        .id(specializationId1)
        .code(101)
        .name("Software Engineering")
        .domain(domain2)
        .build();

    SpecializationDetailResponse expectedResponse = SpecializationDetailResponse.builder()
        .id(specializationId1)
        .code(101)
        .name("Software Engineering")
        .build();

    when(specializationRepository.findById(specializationId1))
        .thenReturn(Optional.of(specialization1));
    when(domainRepository.findById(domainId2)).thenReturn(Optional.of(domain2));
    when(specializationRepository.save(any(Specialization.class))).thenReturn(updatedSpecialization);
    when(specializationMapper.toDetailResponse(updatedSpecialization)).thenReturn(expectedResponse);

    SpecializationDetailResponse result =
        specializationService.updateSpecialization(specializationId1, request);

    assertNotNull(result);
    verify(domainRepository, times(1)).findById(domainId2);
    verify(specializationRepository, times(1)).save(any(Specialization.class));
  }

  @Test
  @DisplayName("updateSpecialization should throw exception when not found")
  void updateSpecialization_ShouldThrowException_WhenNotFound() {
    UUID nonExistentId = UUID.randomUUID();
    UpdateSpecializationRequest request = UpdateSpecializationRequest.builder()
        .code(110)
        .name("Updated Name")
        .build();

    when(specializationRepository.findById(nonExistentId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> specializationService.updateSpecialization(nonExistentId, request));
    verify(specializationRepository, never()).save(any());
  }

  @Test
  @DisplayName("deleteSpecialization should delete specialization")
  void deleteSpecialization_ShouldDeleteSpecialization() {
    when(specializationRepository.findById(specializationId1))
        .thenReturn(Optional.of(specialization1));

    specializationService.deleteSpecialization(specializationId1);

    verify(specializationRepository, times(1)).findById(specializationId1);
    verify(specializationRepository, times(1)).delete(specialization1);
  }

  @Test
  @DisplayName("deleteSpecialization should throw exception when not found")
  void deleteSpecialization_ShouldThrowException_WhenNotFound() {
    UUID nonExistentId = UUID.randomUUID();
    when(specializationRepository.findById(nonExistentId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> specializationService.deleteSpecialization(nonExistentId));
    verify(specializationRepository, never()).delete(any(Specialization.class));
  }
}


