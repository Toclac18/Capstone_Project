package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.OrganizationProfile;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.DocVisibility;
import com.capstone.be.domain.enums.OrgEnrollStatus;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.repository.DocumentRedemptionRepository;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.OrgEnrollmentRepository;
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

  @Override
  @Transactional(readOnly = true)
  public boolean hasAccess(UUID userId, UUID documentId) {
    // Fetch document
    Document document = documentRepository.findById(documentId)
        .orElseThrow(() -> new ResourceNotFoundException("Document", "id", documentId));

    // Fetch user
    User user = userRepository.findById(userId)
        .orElseThrow(() -> ResourceNotFoundException.userById(userId));

    // Check 1: Document is PUBLIC
    if (document.getVisibility() == DocVisibility.PUBLIC) {
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
    boolean hasRedeemed = documentRedemptionRepository.existsByReader_IdAndDocument_Id(userId, documentId);
    if (hasRedeemed) {
      log.debug("Access granted: User {} has redeemed document {}", userId, documentId);
      return true;
    }

    log.debug("Access denied: User {} does not have access to document {}", userId, documentId);
    return false;
  }
}
