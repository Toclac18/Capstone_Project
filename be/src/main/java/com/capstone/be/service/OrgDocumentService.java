package com.capstone.be.service;

import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.DocVisibility;
import com.capstone.be.dto.response.organization.OrgDocumentResponse;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service interface for organization document management
 */
public interface OrgDocumentService {

  /**
   * Get all documents belonging to the organization
   */
  Page<OrgDocumentResponse> getOrganizationDocuments(
      UUID organizationAdminId,
      String search,
      DocStatus status,
      DocVisibility visibility,
      Pageable pageable);

  /**
   * Activate a document (change status to ACTIVE)
   */
  OrgDocumentResponse activateDocument(UUID organizationAdminId, UUID documentId);

  /**
   * Deactivate a document (change status to INACTIVE)
   */
  OrgDocumentResponse deactivateDocument(UUID organizationAdminId, UUID documentId);

  /**
   * Release a document to public (change visibility to PUBLIC and remove organization link)
   */
  OrgDocumentResponse releaseDocument(UUID organizationAdminId, UUID documentId);
}
