package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.OrganizationProfile;
import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.DocVisibility;
import com.capstone.be.dto.response.organization.OrgDocumentResponse;
import com.capstone.be.exception.BusinessException;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.OrganizationProfileRepository;
import com.capstone.be.service.OrgDocumentService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrgDocumentServiceImpl implements OrgDocumentService {

  private final DocumentRepository documentRepository;
  private final OrganizationProfileRepository organizationProfileRepository;

  @Override
  @Transactional(readOnly = true)
  public Page<OrgDocumentResponse> getOrganizationDocuments(
      UUID organizationAdminId,
      String search,
      DocStatus status,
      DocVisibility visibility,
      Pageable pageable) {
    
    OrganizationProfile organization = getOrganizationByAdminId(organizationAdminId);
    
    Specification<Document> spec = buildSpecification(organization.getId(), search, status, visibility);
    
    Page<Document> documents = documentRepository.findAll(spec, pageable);
    
    return documents.map(this::mapToResponse);
  }

  @Override
  @Transactional
  public OrgDocumentResponse activateDocument(UUID organizationAdminId, UUID documentId) {
    OrganizationProfile organization = getOrganizationByAdminId(organizationAdminId);
    Document document = getDocumentById(documentId);
    
    validateDocumentBelongsToOrganization(document, organization);
    
    if (document.getStatus() == DocStatus.ACTIVE) {
      throw new BusinessException(
          "Document is already active",
          HttpStatus.BAD_REQUEST,
          "DOCUMENT_ALREADY_ACTIVE"
      );
    }
    
    // Only allow activation from INACTIVE status
    if (document.getStatus() != DocStatus.INACTIVE) {
      throw new BusinessException(
          "Can only activate documents with INACTIVE status",
          HttpStatus.BAD_REQUEST,
          "INVALID_STATUS_TRANSITION"
      );
    }
    
    document.setStatus(DocStatus.ACTIVE);
    document = documentRepository.save(document);
    
    log.info("Document {} activated by org admin {}", documentId, organizationAdminId);
    
    return mapToResponse(document);
  }

  @Override
  @Transactional
  public OrgDocumentResponse deactivateDocument(UUID organizationAdminId, UUID documentId) {
    OrganizationProfile organization = getOrganizationByAdminId(organizationAdminId);
    Document document = getDocumentById(documentId);
    
    validateDocumentBelongsToOrganization(document, organization);
    
    if (document.getStatus() == DocStatus.INACTIVE) {
      throw new BusinessException(
          "Document is already inactive",
          HttpStatus.BAD_REQUEST,
          "DOCUMENT_ALREADY_INACTIVE"
      );
    }
    
    // Only allow deactivation from ACTIVE status
    if (document.getStatus() != DocStatus.ACTIVE) {
      throw new BusinessException(
          "Can only deactivate documents with ACTIVE status",
          HttpStatus.BAD_REQUEST,
          "INVALID_STATUS_TRANSITION"
      );
    }
    
    document.setStatus(DocStatus.INACTIVE);
    document = documentRepository.save(document);
    
    log.info("Document {} deactivated by org admin {}", documentId, organizationAdminId);
    
    return mapToResponse(document);
  }

  @Override
  @Transactional
  public OrgDocumentResponse releaseDocument(UUID organizationAdminId, UUID documentId) {
    OrganizationProfile organization = getOrganizationByAdminId(organizationAdminId);
    Document document = getDocumentById(documentId);
    
    validateDocumentBelongsToOrganization(document, organization);
    
    // Only allow release of ACTIVE documents
    if (document.getStatus() != DocStatus.ACTIVE) {
      throw new BusinessException(
          "Can only release documents with ACTIVE status",
          HttpStatus.BAD_REQUEST,
          "INVALID_STATUS_FOR_RELEASE"
      );
    }
    
    // Change visibility to PUBLIC and remove organization link
    document.setVisibility(DocVisibility.PUBLIC);
    document.setOrganization(null);
    document = documentRepository.save(document);
    
    log.info("Document {} released to public by org admin {}", documentId, organizationAdminId);
    
    return mapToResponse(document);
  }

  // Helper methods
  
  private OrganizationProfile getOrganizationByAdminId(UUID adminId) {
    return organizationProfileRepository.findByAdminId(adminId)
        .orElseThrow(() -> new ResourceNotFoundException(
            "Organization", "admin_id", adminId));
  }

  private Document getDocumentById(UUID documentId) {
    return documentRepository.findById(documentId)
        .orElseThrow(() -> new ResourceNotFoundException(
            "Document", "id", documentId));
  }

  private void validateDocumentBelongsToOrganization(Document document, OrganizationProfile organization) {
    if (document.getOrganization() == null || 
        !document.getOrganization().getId().equals(organization.getId())) {
      throw new BusinessException(
          "Document does not belong to this organization",
          HttpStatus.FORBIDDEN,
          "DOCUMENT_NOT_IN_ORGANIZATION"
      );
    }
  }

  private Specification<Document> buildSpecification(
      UUID organizationId, String search, DocStatus status, DocVisibility visibility) {
    
    return (root, query, cb) -> {
      var predicates = new java.util.ArrayList<jakarta.persistence.criteria.Predicate>();
      
      // Must belong to organization
      predicates.add(cb.equal(root.get("organization").get("id"), organizationId));
      
      // Search by title
      if (search != null && !search.trim().isEmpty()) {
        predicates.add(cb.like(
            cb.lower(root.get("title")),
            "%" + search.toLowerCase().trim() + "%"
        ));
      }
      
      // Filter by status
      if (status != null) {
        predicates.add(cb.equal(root.get("status"), status));
      }
      
      // Filter by visibility
      if (visibility != null) {
        predicates.add(cb.equal(root.get("visibility"), visibility));
      }
      
      return cb.and(predicates.toArray(new jakarta.persistence.criteria.Predicate[0]));
    };
  }

  private OrgDocumentResponse mapToResponse(Document document) {
    OrgDocumentResponse.UploaderInfo uploaderInfo = null;
    if (document.getUploader() != null) {
      uploaderInfo = OrgDocumentResponse.UploaderInfo.builder()
          .id(document.getUploader().getId())
          .fullName(document.getUploader().getFullName())
          .email(document.getUploader().getEmail())
          .build();
    }

    OrgDocumentResponse.DocTypeInfo docTypeInfo = null;
    if (document.getDocType() != null) {
      docTypeInfo = OrgDocumentResponse.DocTypeInfo.builder()
          .id(document.getDocType().getId())
          .name(document.getDocType().getName())
          .build();
    }

    OrgDocumentResponse.SpecializationInfo specInfo = null;
    if (document.getSpecialization() != null) {
      specInfo = OrgDocumentResponse.SpecializationInfo.builder()
          .id(document.getSpecialization().getId())
          .name(document.getSpecialization().getName())
          .domainName(document.getSpecialization().getDomain() != null 
              ? document.getSpecialization().getDomain().getName() 
              : null)
          .build();
    }

    return OrgDocumentResponse.builder()
        .id(document.getId())
        .title(document.getTitle())
        .description(document.getDescription())
        .thumbnailUrl(document.getThumbnailKey())
        .status(document.getStatus())
        .visibility(document.getVisibility())
        .isPremium(document.getIsPremium())
        .price(document.getPrice())
        .pageCount(document.getPageCount())
        .viewCount(document.getViewCount())
        .upvoteCount(document.getUpvoteCount())
        .createdAt(document.getCreatedAt())
        .updatedAt(document.getUpdatedAt())
        .uploader(uploaderInfo)
        .docType(docTypeInfo)
        .specialization(specInfo)
        .build();
  }
}
