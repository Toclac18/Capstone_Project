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

import com.capstone.be.domain.entity.DocType;
import com.capstone.be.dto.request.doctype.CreateDocTypeRequest;
import com.capstone.be.dto.request.doctype.UpdateDocTypeRequest;
import com.capstone.be.dto.response.doctype.DocTypeDetailResponse;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.mapper.DocTypeMapper;
import com.capstone.be.repository.DocTypeRepository;
import com.capstone.be.service.impl.DocTypeServiceImpl;
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
@DisplayName("DocTypeService Unit Tests")
class DocTypeServiceTest {

  @Mock
  private DocTypeRepository docTypeRepository;

  @Mock
  private DocTypeMapper docTypeMapper;

  @InjectMocks
  private DocTypeServiceImpl docTypeService;

  private DocType docType1;
  private DocType docType2;
  private UUID docTypeId1;
  private UUID docTypeId2;

  @BeforeEach
  void setUp() {
    docTypeId1 = UUID.randomUUID();
    docTypeId2 = UUID.randomUUID();

    docType1 = DocType.builder()
        .id(docTypeId1)
        .code(1)
        .name("Research Paper")
        .description("Academic research paper")
        .createdAt(Instant.now())
        .updatedAt(Instant.now())
        .build();

    docType2 = DocType.builder()
        .id(docTypeId2)
        .code(2)
        .name("Book")
        .description("Published book")
        .createdAt(Instant.now())
        .updatedAt(Instant.now())
        .build();
  }

  @Test
  @DisplayName("getAllDocTypes should return all doc types")
  void getAllDocTypes_ShouldReturnAllDocTypes() {
    List<DocType> docTypes = Arrays.asList(docType1, docType2);
    when(docTypeRepository.findAll()).thenReturn(docTypes);

    List<DocType> result = docTypeService.getAllDocTypes();

    assertNotNull(result);
    assertEquals(2, result.size());
    assertEquals("Research Paper", result.get(0).getName());
    verify(docTypeRepository, times(1)).findAll();
  }

  @Test
  @DisplayName("getAllDocTypes should return empty list when no doc types")
  void getAllDocTypes_ShouldReturnEmptyList() {
    when(docTypeRepository.findAll()).thenReturn(Collections.emptyList());

    List<DocType> result = docTypeService.getAllDocTypes();

    assertNotNull(result);
    assertTrue(result.isEmpty());
  }

  @Test
  @DisplayName("getAllDocTypesForAdmin should return paginated doc types")
  void getAllDocTypesForAdmin_ShouldReturnPaginatedDocTypes() {
    Pageable pageable = PageRequest.of(0, 10);
    List<DocType> docTypes = Arrays.asList(docType1, docType2);
    Page<DocType> docTypePage = new PageImpl<>(docTypes, pageable, 2);

    DocTypeDetailResponse response1 = DocTypeDetailResponse.builder()
        .id(docTypeId1)
        .code(1)
        .name("Research Paper")
        .description("Academic research paper")
        .build();
    DocTypeDetailResponse response2 = DocTypeDetailResponse.builder()
        .id(docTypeId2)
        .code(2)
        .name("Book")
        .description("Published book")
        .build();

    when(docTypeRepository.findAll(isA(Specification.class), eq(pageable))).thenReturn(docTypePage);
    when(docTypeMapper.toDetailResponse(docType1)).thenReturn(response1);
    when(docTypeMapper.toDetailResponse(docType2)).thenReturn(response2);

    Page<DocTypeDetailResponse> result = docTypeService.getAllDocTypesForAdmin(null, pageable);

    assertNotNull(result);
    assertEquals(2, result.getTotalElements());
    verify(docTypeRepository, times(1)).findAll(isA(Specification.class), eq(pageable));
  }

  @Test
  @DisplayName("getAllDocTypesForAdmin should filter by name")
  void getAllDocTypesForAdmin_ShouldFilterByName() {
    Pageable pageable = PageRequest.of(0, 10);
    String nameFilter = "Research";
    List<DocType> filteredDocTypes = Collections.singletonList(docType1);
    Page<DocType> docTypePage = new PageImpl<>(filteredDocTypes, pageable, 1);

    DocTypeDetailResponse response1 = DocTypeDetailResponse.builder()
        .id(docTypeId1)
        .code(1)
        .name("Research Paper")
        .description("Academic research paper")
        .build();

    when(docTypeRepository.findAll(isA(Specification.class), eq(pageable))).thenReturn(docTypePage);
    when(docTypeMapper.toDetailResponse(docType1)).thenReturn(response1);

    Page<DocTypeDetailResponse> result = docTypeService.getAllDocTypesForAdmin(nameFilter, pageable);

    assertEquals(1, result.getTotalElements());
    assertEquals("Research Paper", result.getContent().get(0).getName());
  }

  @Test
  @DisplayName("getDocTypeById should return doc type when exists")
  void getDocTypeById_ShouldReturnDocType() {
    DocTypeDetailResponse expectedResponse = DocTypeDetailResponse.builder()
        .id(docTypeId1)
        .code(1)
        .name("Research Paper")
        .description("Academic research paper")
        .build();

    when(docTypeRepository.findById(docTypeId1)).thenReturn(Optional.of(docType1));
    when(docTypeMapper.toDetailResponse(docType1)).thenReturn(expectedResponse);

    DocTypeDetailResponse result = docTypeService.getDocTypeById(docTypeId1);

    assertNotNull(result);
    assertEquals(docTypeId1, result.getId());
    assertEquals("Research Paper", result.getName());
    verify(docTypeRepository, times(1)).findById(docTypeId1);
  }

  @Test
  @DisplayName("getDocTypeById should throw exception when not found")
  void getDocTypeById_ShouldThrowException_WhenNotFound() {
    UUID nonExistentId = UUID.randomUUID();
    when(docTypeRepository.findById(nonExistentId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> docTypeService.getDocTypeById(nonExistentId));
    verify(docTypeMapper, never()).toDetailResponse(any());
  }

  @Test
  @DisplayName("createDocType should create new doc type")
  void createDocType_ShouldCreateDocType() {
    CreateDocTypeRequest request = CreateDocTypeRequest.builder()
        .code(3)
        .name("Article")
        .description("News article")
        .build();

    DocType newDocType = DocType.builder()
        .id(UUID.randomUUID())
        .code(3)
        .name("Article")
        .description("News article")
        .createdAt(Instant.now())
        .updatedAt(Instant.now())
        .build();

    DocTypeDetailResponse expectedResponse = DocTypeDetailResponse.builder()
        .id(newDocType.getId())
        .code(3)
        .name("Article")
        .description("News article")
        .build();

    when(docTypeRepository.save(any(DocType.class))).thenReturn(newDocType);
    when(docTypeMapper.toDetailResponse(newDocType)).thenReturn(expectedResponse);

    DocTypeDetailResponse result = docTypeService.createDocType(request);

    assertNotNull(result);
    assertEquals(3, result.getCode());
    assertEquals("Article", result.getName());
    verify(docTypeRepository, times(1)).save(any(DocType.class));
  }

  @Test
  @DisplayName("updateDocType should update doc type")
  void updateDocType_ShouldUpdateDocType() {
    UpdateDocTypeRequest request = UpdateDocTypeRequest.builder()
        .code(10)
        .name("Updated Research Paper")
        .description("Updated description")
        .build();

    DocType updatedDocType = DocType.builder()
        .id(docTypeId1)
        .code(10)
        .name("Updated Research Paper")
        .description("Updated description")
        .build();

    DocTypeDetailResponse expectedResponse = DocTypeDetailResponse.builder()
        .id(docTypeId1)
        .code(10)
        .name("Updated Research Paper")
        .description("Updated description")
        .build();

    when(docTypeRepository.findById(docTypeId1)).thenReturn(Optional.of(docType1));
    when(docTypeRepository.save(any(DocType.class))).thenReturn(updatedDocType);
    when(docTypeMapper.toDetailResponse(updatedDocType)).thenReturn(expectedResponse);

    DocTypeDetailResponse result = docTypeService.updateDocType(docTypeId1, request);

    assertEquals(10, result.getCode());
    assertEquals("Updated Research Paper", result.getName());
    assertEquals("Updated description", result.getDescription());
    verify(docTypeRepository, times(1)).save(any(DocType.class));
  }

  @Test
  @DisplayName("updateDocType should throw exception when not found")
  void updateDocType_ShouldThrowException_WhenNotFound() {
    UUID nonExistentId = UUID.randomUUID();
    UpdateDocTypeRequest request = UpdateDocTypeRequest.builder()
        .code(10)
        .name("Updated Name")
        .build();

    when(docTypeRepository.findById(nonExistentId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> docTypeService.updateDocType(nonExistentId, request));
    verify(docTypeRepository, never()).save(any());
  }

  @Test
  @DisplayName("deleteDocType should delete doc type")
  void deleteDocType_ShouldDeleteDocType() {
    when(docTypeRepository.findById(docTypeId1)).thenReturn(Optional.of(docType1));

    docTypeService.deleteDocType(docTypeId1);

    verify(docTypeRepository, times(1)).findById(docTypeId1);
    verify(docTypeRepository, times(1)).delete(docType1);
  }

  @Test
  @DisplayName("deleteDocType should throw exception when not found")
  void deleteDocType_ShouldThrowException_WhenNotFound() {
    UUID nonExistentId = UUID.randomUUID();
    when(docTypeRepository.findById(nonExistentId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> docTypeService.deleteDocType(nonExistentId));
    verify(docTypeRepository, never()).delete(any(DocType.class));
  }
}


