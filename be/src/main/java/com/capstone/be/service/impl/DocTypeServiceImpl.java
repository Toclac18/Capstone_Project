package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.DocType;
import com.capstone.be.dto.request.doctype.CreateDocTypeRequest;
import com.capstone.be.dto.request.doctype.UpdateDocTypeRequest;
import com.capstone.be.dto.response.doctype.DocTypeDetailResponse;
import com.capstone.be.exception.InvalidRequestException;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.mapper.DocTypeMapper;
import com.capstone.be.repository.DocTypeRepository;
import com.capstone.be.repository.specification.DocTypeSpecification;
import com.capstone.be.service.DocTypeService;
import java.util.List;
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
public class DocTypeServiceImpl implements DocTypeService {

  private final DocTypeRepository docTypeRepository;
  private final DocTypeMapper docTypeMapper;

  @Override
  @Transactional(readOnly = true)
  public List<DocType> getAllDocTypes() {
    log.info("Fetching all document types");

    List<DocType> docTypes = docTypeRepository.findAll();

    log.info("Retrieved {} document types", docTypes.size());
    return docTypes;
  }

  // ===== ADMIN METHODS =====

  @Override
  @Transactional(readOnly = true)
  public Page<DocTypeDetailResponse> getAllDocTypesForAdmin(String name, java.time.Instant dateFrom, java.time.Instant dateTo, Pageable pageable) {
    log.info("Admin fetching document types - name: {}, dateFrom: {}, dateTo: {}, page: {}, size: {}",
        name, dateFrom, dateTo, pageable.getPageNumber(), pageable.getPageSize());

    Specification<DocType> spec = DocTypeSpecification.withFilters(name, dateFrom, dateTo);
    Page<DocType> docTypePage = docTypeRepository.findAll(spec, pageable);

    log.info("Retrieved {} document types for admin", docTypePage.getTotalElements());
    return docTypePage.map(docTypeMapper::toDetailResponse);
  }

  @Override
  @Transactional(readOnly = true)
  public DocTypeDetailResponse getDocTypeById(UUID docTypeId) {
    log.info("Admin fetching document type by ID: {}", docTypeId);

    DocType docType = docTypeRepository.findById(docTypeId)
        .orElseThrow(() -> new ResourceNotFoundException("DocType", docTypeId));

    log.info("Retrieved document type: {}", docType.getName());
    return docTypeMapper.toDetailResponse(docType);
  }

  @Override
  @Transactional
  public DocTypeDetailResponse createDocType(CreateDocTypeRequest request) {
    log.info("Admin creating new document type: {}", request.getName());

    // Check duplicate code
    if (docTypeRepository.existsByCode(request.getCode())) {
      throw new InvalidRequestException(
          "Document type with code '" + request.getCode() + "' already exists",
          "DUPLICATE_DOCTYPE_CODE"
      );
    }

    // Check duplicate name (case-insensitive)
    if (docTypeRepository.existsByNameIgnoreCase(request.getName().trim())) {
      throw new InvalidRequestException(
          "Document type with name '" + request.getName() + "' already exists",
          "DUPLICATE_DOCTYPE_NAME"
      );
    }

    // Create new document type
    DocType docType = DocType.builder()
        .code(request.getCode())
        .name(request.getName().trim())
        .description(request.getDescription())
        .build();

    docType = docTypeRepository.save(docType);

    log.info("Created document type with ID: {}", docType.getId());
    return docTypeMapper.toDetailResponse(docType);
  }

  @Override
  @Transactional
  public DocTypeDetailResponse updateDocType(UUID docTypeId, UpdateDocTypeRequest request) {
    log.info("Admin updating document type: {}", docTypeId);

    // Find existing document type
    DocType docType = docTypeRepository.findById(docTypeId)
        .orElseThrow(() -> new ResourceNotFoundException("DocType", docTypeId));

    // Check duplicate code (exclude current)
    if (docTypeRepository.existsByCodeAndIdNot(request.getCode(), docTypeId)) {
      throw new InvalidRequestException(
          "Document type with code '" + request.getCode() + "' already exists",
          "DUPLICATE_DOCTYPE_CODE"
      );
    }

    // Check duplicate name (case-insensitive, exclude current)
    if (docTypeRepository.existsByNameIgnoreCaseAndIdNot(request.getName().trim(), docTypeId)) {
      throw new InvalidRequestException(
          "Document type with name '" + request.getName() + "' already exists",
          "DUPLICATE_DOCTYPE_NAME"
      );
    }

    // Update fields
    docType.setCode(request.getCode());
    docType.setName(request.getName().trim());
    docType.setDescription(request.getDescription());

    docType = docTypeRepository.save(docType);

    log.info("Updated document type: {}", docType.getName());
    return docTypeMapper.toDetailResponse(docType);
  }

  @Override
  @Transactional
  public void deleteDocType(UUID docTypeId) {
    log.info("Admin deleting document type: {}", docTypeId);

    // Find document type
    DocType docType = docTypeRepository.findById(docTypeId)
        .orElseThrow(() -> new ResourceNotFoundException("DocType", docTypeId));

    // TODO: Check if docType is used by any documents
    // If used, we might want to prevent deletion or soft delete

    docTypeRepository.delete(docType);

    log.info("Deleted document type: {}", docType.getName());
  }
}
