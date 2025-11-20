package com.capstone.be.service;

import com.capstone.be.dto.request.organization.ApproveOrganizationRequest;
import com.capstone.be.dto.response.organization.PendingOrganizationResponse;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service for Business Admin to manage organization approvals
 */
public interface OrganizationApprovalService {

  /**
   * Get all pending organizations (PENDING_APPROVE status)
   */
  Page<PendingOrganizationResponse> getPendingOrganizations(Pageable pageable);

  /**
   * Get details of a specific pending organization
   */
  PendingOrganizationResponse getPendingOrganizationById(UUID adminUserId);

  /**
   * Approve or reject an organization registration
   * If approved: status -> ACTIVE, send welcome email
   * If rejected: status -> REJECTED, send rejection email with reason
   */
  void approveOrRejectOrganization(ApproveOrganizationRequest request);
}
