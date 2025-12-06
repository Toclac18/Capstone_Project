package com.capstone.be.service;

import java.util.UUID;

/**
 * Service interface for document access control
 */
public interface DocumentAccessService {

  /**
   * Check if a user has access to view/download a document
   * Access is granted if:
   * - Document is PUBLIC and not Premium, OR
   * - User is the uploader, OR
   * - User is a member of the document's organization (for INTERNAL documents), OR
   * - User has redeemed/purchased the document, OR
   * - User is assigned as reviewer for this document (with ACCEPTED status)
   *
   * @param userId User ID requesting access
   * @param documentId Document ID
   * @return true if user has access, false otherwise
   */
  boolean hasAccess(UUID userId, UUID documentId);
}
