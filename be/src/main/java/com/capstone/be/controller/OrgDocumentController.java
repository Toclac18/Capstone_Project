package com.capstone.be.controller;

import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.DocVisibility;
import com.capstone.be.dto.common.PagedResponse;
import com.capstone.be.dto.response.organization.OrgDocumentResponse;
import com.capstone.be.security.model.UserPrincipal;
import com.capstone.be.service.OrgDocumentService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for organization document management
 * Handles document listing, activation, deactivation, and release to public
 */
@Slf4j
@RestController
@RequestMapping("/organization/documents")
@RequiredArgsConstructor
public class OrgDocumentController {

  private final OrgDocumentService orgDocumentService;

  /**
   * Get all documents belonging to the organization
   * GET /api/v1/organization/documents
   */
  @GetMapping
  @PreAuthorize("hasRole('ORGANIZATION_ADMIN')")
  public ResponseEntity<PagedResponse<OrgDocumentResponse>> getOrganizationDocuments(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @RequestParam(name = "search", required = false) String search,
      @RequestParam(name = "status", required = false) DocStatus status,
      @RequestParam(name = "visibility", required = false) DocVisibility visibility,
      Pageable pageable) {
    UUID adminId = userPrincipal.getId();
    log.info("Get organization documents for admin: {}, search: {}, status: {}, visibility: {}",
        adminId, search, status, visibility);

    Page<OrgDocumentResponse> documents = orgDocumentService.getOrganizationDocuments(
        adminId, search, status, visibility, pageable);

    return ResponseEntity.ok(PagedResponse.of(documents));
  }

  /**
   * Activate a document (make it visible/accessible)
   * PUT /api/v1/organization/documents/{documentId}/activate
   */
  @PutMapping("/{documentId}/activate")
  @PreAuthorize("hasRole('ORGANIZATION_ADMIN')")
  public ResponseEntity<OrgDocumentResponse> activateDocument(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @PathVariable(name = "documentId") UUID documentId) {
    UUID adminId = userPrincipal.getId();
    log.info("Organization admin {} activating document: {}", adminId, documentId);

    OrgDocumentResponse response = orgDocumentService.activateDocument(adminId, documentId);

    return ResponseEntity.ok(response);
  }

  /**
   * Deactivate a document (make it hidden/inaccessible)
   * PUT /api/v1/organization/documents/{documentId}/deactivate
   */
  @PutMapping("/{documentId}/deactivate")
  @PreAuthorize("hasRole('ORGANIZATION_ADMIN')")
  public ResponseEntity<OrgDocumentResponse> deactivateDocument(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @PathVariable(name = "documentId") UUID documentId) {
    UUID adminId = userPrincipal.getId();
    log.info("Organization admin {} deactivating document: {}", adminId, documentId);

    OrgDocumentResponse response = orgDocumentService.deactivateDocument(adminId, documentId);

    return ResponseEntity.ok(response);
  }

  /**
   * Release a document to public (change visibility to PUBLIC and remove from org management)
   * PUT /api/v1/organization/documents/{documentId}/release
   */
  @PutMapping("/{documentId}/release")
  @PreAuthorize("hasRole('ORGANIZATION_ADMIN')")
  public ResponseEntity<OrgDocumentResponse> releaseDocument(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @PathVariable(name = "documentId") UUID documentId) {
    UUID adminId = userPrincipal.getId();
    log.info("Organization admin {} releasing document to public: {}", adminId, documentId);

    OrgDocumentResponse response = orgDocumentService.releaseDocument(adminId, documentId);

    return ResponseEntity.ok(response);
  }
}
