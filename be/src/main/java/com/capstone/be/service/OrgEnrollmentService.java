package com.capstone.be.service;

import com.capstone.be.domain.enums.OrgEnrollStatus;
import com.capstone.be.dto.response.organization.ImportResultItemResponse;
import com.capstone.be.dto.response.organization.InviteMembersResponse;
import com.capstone.be.dto.response.organization.MemberImportBatchResponse;
import com.capstone.be.dto.response.organization.OrgEnrollmentResponse;
import java.util.List;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

/**
 * Service for managing organization member enrollments
 */
public interface OrgEnrollmentService {

  /**
   * Invite members to organization by email list (manual)
   *
   * @param organizationAdminId Organization admin user ID
   * @param emails              List of email addresses
   * @return Invitation result summary
   */
  InviteMembersResponse inviteMembers(UUID organizationAdminId, List<String> emails);

  /**
   * Invite members to organization by Excel file
   *
   * @param organizationAdminId Organization admin user ID
   * @param file                Excel file containing email list
   * @return Invitation result summary
   */
  InviteMembersResponse inviteMembersByExcel(UUID organizationAdminId, MultipartFile file);

  /**
   * Get all enrollments for an organization
   *
   * @param organizationAdminId Organization admin user ID
   * @param status              Filter by status (optional)
   * @param search              Search by member name or email (optional)
   * @param pageable            Pagination
   * @return Page of enrollments
   */
  Page<OrgEnrollmentResponse> getOrganizationMembers(
      UUID organizationAdminId,
      OrgEnrollStatus status,
      String search,
      Pageable pageable
  );

  /**
   * Get pending invitations for a reader
   *
   * @param readerId Reader user ID
   * @param pageable Pagination
   * @return Page of pending invitations
   */
  Page<OrgEnrollmentResponse> getMyPendingInvitations(UUID readerId, Pageable pageable);

  /**
   * Get joined organizations for a reader
   *
   * @param readerId Reader user ID
   * @param pageable Pagination
   * @return Page of joined organizations
   */
  Page<OrgEnrollmentResponse> getMyOrganizations(UUID readerId, Pageable pageable);

  /**
   * Reader accepts organization invitation
   *
   * @param readerId     Reader user ID
   * @param enrollmentId Enrollment ID
   */
  void acceptInvitation(UUID readerId, UUID enrollmentId);

  /**
   * Accept organization invitation using JWT token from email link
   *
   * @param token  JWT invitation token
   * @param userId User ID (from authentication)
   */
  void acceptInvitationByToken(String token, UUID userId);

  /**
   * Reader rejects organization invitation
   *
   * @param readerId     Reader user ID
   * @param enrollmentId Enrollment ID
   */
  void rejectInvitation(UUID readerId, UUID enrollmentId);

  /**
   * Organization admin removes a member
   *
   * @param organizationAdminId Organization admin user ID
   * @param enrollmentId        Enrollment ID
   */
  void removeMember(UUID organizationAdminId, UUID enrollmentId);

  /**
   * Reader leaves an organization
   *
   * @param readerId       Reader user ID
   * @param organizationId Organization ID
   */
  void leaveOrganization(UUID readerId, UUID organizationId);

  /**
   * Re-invite a member who has LEFT the organization
   * Only works for members with LEFT status
   *
   * @param organizationAdminId Organization admin user ID
   * @param enrollmentId        Enrollment ID
   */
  void reInviteMember(UUID organizationAdminId, UUID enrollmentId);

  /**
   * Get enrollment detail
   *
   * @param enrollmentId Enrollment ID
   * @return Enrollment detail
   */
  OrgEnrollmentResponse getEnrollmentDetail(UUID enrollmentId);

  /**
   * Get import batches for an organization
   *
   * @param organizationAdminId Organization admin user ID
   * @param search              Search keyword (optional)
   * @param pageable            Pagination
   * @return Page of import batches
   */
  Page<MemberImportBatchResponse> getImportBatches(UUID organizationAdminId, String search, Pageable pageable);

  /**
   * Get successful enrollments for a specific import batch
   *
   * @param organizationAdminId Organization admin user ID
   * @param importBatchId       Import batch ID
   * @param pageable            Pagination
   * @return Page of enrollments from this batch
   */
  Page<OrgEnrollmentResponse> getImportBatchEnrollments(
      UUID organizationAdminId,
      UUID importBatchId,
      Pageable pageable
  );

  /**
   * Update enrollment status by organization admin
   *
   * @param organizationAdminId Organization admin user ID
   * @param enrollmentId        Enrollment ID
   * @param newStatus           New enrollment status
   * @return Updated enrollment detail
   */
  OrgEnrollmentResponse updateEnrollmentStatus(
      UUID organizationAdminId,
      UUID enrollmentId,
      OrgEnrollStatus newStatus
  );

  /**
   * Get import result items for a specific import batch
   *
   * @param organizationAdminId Organization admin user ID
   * @param importBatchId       Import batch ID
   * @param pageable            Pagination
   * @return Page of import result items
   */
  Page<ImportResultItemResponse> getImportResultItems(
      UUID organizationAdminId,
      UUID importBatchId,
      Pageable pageable
  );
}
