package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.OrganizationProfile;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.DocVisibility;
import com.capstone.be.domain.enums.OrgEnrollStatus;
import com.capstone.be.domain.enums.ReviewRequestStatus;
import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.repository.DocumentRedemptionRepository;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.OrgEnrollmentRepository;
import com.capstone.be.repository.ReaderProfileRepository;
import com.capstone.be.repository.ReviewRequestRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.service.DocumentAccessService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class DocumentAccessServiceImpl implements DocumentAccessService {

  private final DocumentRepository documentRepository;
  private final UserRepository userRepository;
  private final OrgEnrollmentRepository orgEnrollmentRepository;
  private final DocumentRedemptionRepository documentRedemptionRepository;
  private final ReviewRequestRepository reviewRequestRepository;
  private final ReaderProfileRepository readerProfileRepository;

  @Override
  @Transactional(readOnly = true)
  public boolean hasAccess(UUID userId, UUID documentId) {
    // Fetch document
    Document document = documentRepository.findById(documentId)
        .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId));

    // Fetch user
    User user = userRepository.findById(userId)
        .orElseThrow(() -> ResourceNotFoundException.userById(userId));

    // Check 0: Business Admin has access to ALL documents regardless of status
    if (user.getRole() == UserRole.BUSINESS_ADMIN) {
      log.debug("Access granted: User {} is Business Admin with full access", userId);
      return true;
    }

    // Check for INACTIVE documents - restricted access
    if (document.getStatus() == DocStatus.INACTIVE) {
      return hasAccessToInactiveDocument(document, user, userId, documentId);
    }

    // Check 1: Document is PUBLIC and not Premium
    if (!document.getIsPremium() && document.getVisibility() == DocVisibility.PUBLIC) {
      log.debug("Access granted: Document {} is PUBLIC", documentId);
      return true;
    }

    // Check 2: User is the uploader
    if (document.getUploader().getId().equals(userId)) {
      log.debug("Access granted: User {} is the uploader of document {}", userId, documentId);
      return true;
    }

    // Check 3: User is member of document's organization (for INTERNAL documents)
    if (document.getVisibility() == DocVisibility.INTERNAL && document.getOrganization() != null) {
      OrganizationProfile organization = document.getOrganization();
      boolean isMember = orgEnrollmentRepository.findByOrganizationAndMember(organization, user)
          .map(enrollment -> enrollment.getStatus() == OrgEnrollStatus.JOINED)
          .orElse(false);

      if (isMember) {
        log.debug("Access granted: User {} is a member of organization {} for INTERNAL document {}",
            userId, organization.getId(), documentId);
        return true;
      }
    }

    // Check 4: User has redeemed/purchased the document
    // Note: DocumentRedemption stores reader.id (ReaderProfile ID), not user.id
    boolean hasRedeemed = readerProfileRepository.findByUserId(userId)
        .map(reader -> documentRedemptionRepository.existsByReader_IdAndDocument_Id(reader.getId(), documentId))
        .orElse(false);
    if (hasRedeemed) {
      log.debug("Access granted: User {} has redeemed document {}", userId, documentId);
      return true;
    }

    // Check 5: User is assigned as reviewer with ACCEPTED status
    boolean isReviewer = reviewRequestRepository
        .findByDocument_IdAndReviewer_Id(documentId, userId)
        .map(reviewRequest -> reviewRequest.getStatus() == ReviewRequestStatus.ACCEPTED)
        .orElse(false);
    if (isReviewer) {
      log.debug("Access granted: User {} is an assigned reviewer for document {}", userId, documentId);
      return true;
    }

    log.debug("Access denied: User {} does not have access to document {}", userId, documentId);
    return false;
  }

  /**
   * Check access for INACTIVE documents.
   * Only the following users can access INACTIVE documents:
   * 1. Business Admin (BA)
   * 2. Document Uploader
   * 3. Org Admin of the document's organization
   */
  private boolean hasAccessToInactiveDocument(Document document, User user, UUID userId, UUID documentId) {
    // Check 1: User is Business Admin
    if (user.getRole() == UserRole.BUSINESS_ADMIN) {
      log.debug("Access granted to INACTIVE document {}: User {} is Business Admin", documentId, userId);
      return true;
    }

    // Check 2: User is the uploader
    if (document.getUploader() != null && document.getUploader().getId().equals(userId)) {
      log.debug("Access granted to INACTIVE document {}: User {} is the uploader", documentId, userId);
      return true;
    }

    // Check 3: User is Org Admin of the document's organization
    if (document.getOrganization() != null) {
      OrganizationProfile organization = document.getOrganization();
      // Check if user is the admin of this organization
      if (organization.getAdmin() != null && organization.getAdmin().getId().equals(userId)) {
        log.debug("Access granted to INACTIVE document {}: User {} is Org Admin of organization {}", 
            documentId, userId, organization.getId());
        return true;
      }
    }

    log.debug("Access denied to INACTIVE document {}: User {} is not BA, uploader, or Org Admin", 
        documentId, userId);
    return false;
  }
}
