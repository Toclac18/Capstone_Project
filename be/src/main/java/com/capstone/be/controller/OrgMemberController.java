package com.capstone.be.controller;

import com.capstone.be.domain.enums.OrgEnrollStatus;
import com.capstone.be.dto.common.PagedResponse;
import com.capstone.be.dto.request.organization.InviteMembersRequest;
import com.capstone.be.dto.request.organization.UpdateEnrollStatusRequest;
import com.capstone.be.dto.response.organization.InviteMembersResponse;
import com.capstone.be.dto.response.organization.MemberImportBatchResponse;
import com.capstone.be.dto.response.organization.OrgEnrollmentResponse;
import com.capstone.be.security.model.UserPrincipal;
import com.capstone.be.service.OrgEnrollmentService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Controller for organization member management
 * Handles member invitations, enrollment, and management
 */
@Slf4j
@RestController
@RequestMapping("/organization/members")
@RequiredArgsConstructor
public class OrgMemberController {

  private final OrgEnrollmentService orgEnrollmentService;

  /**
   * Invite members to organization (manual email list)
   * POST /api/v1/organization/members/invite
   *
   * @param userPrincipal Organization admin
   * @param request       Invite request with email list
   * @return Invitation result summary
   */
  @PostMapping("/invite")
  @PreAuthorize("hasRole('ORGANIZATION_ADMIN')")
  public ResponseEntity<InviteMembersResponse> inviteMembers(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @Valid @RequestBody InviteMembersRequest request) {
    UUID adminId = userPrincipal.getId();
    log.info("Organization admin {} inviting {} members", adminId, request.getEmails().size());

    InviteMembersResponse response = orgEnrollmentService.inviteMembers(adminId,
        request.getEmails());

    return ResponseEntity.ok(response);
  }

  /**
   * Invite members to organization via Excel file
   * POST /api/v1/organization/members/invite/excel
   *
   * @param userPrincipal Organization admin
   * @param file          Excel file containing email list
   * @return Invitation result summary
   */
  @PostMapping(value = "/invite/excel", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @PreAuthorize("hasRole('ORGANIZATION_ADMIN')")
  public ResponseEntity<InviteMembersResponse> inviteMembersByExcel(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @RequestParam(name = "file") MultipartFile file) {
    UUID adminId = userPrincipal.getId();
    log.info("Organization admin {} inviting members via Excel", adminId);

    InviteMembersResponse response = orgEnrollmentService.inviteMembersByExcel(adminId, file);

    return ResponseEntity.ok(response);
  }

  /**
   * Get all members/enrollments for organization
   * GET /api/v1/organization/members
   *
   * @param userPrincipal Organization admin
   * @param status        Filter by status (optional)
   * @param search        Search by member name or email (optional)
   * @param pageable      Pagination parameters
   * @return Paged response of enrollments
   */
  @GetMapping
  @PreAuthorize("hasRole('ORGANIZATION_ADMIN')")
  public ResponseEntity<PagedResponse<OrgEnrollmentResponse>> getOrganizationMembers(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @RequestParam(name = "status", required = false) OrgEnrollStatus status,
      @RequestParam(name = "search", required = false) String search,
      Pageable pageable) {
    UUID adminId = userPrincipal.getId();
    log.info("Get organization members for admin: {}, status: {}, search: {}", adminId, status,
        search);

    Page<OrgEnrollmentResponse> members = orgEnrollmentService.getOrganizationMembers(
        adminId, status, search, pageable);

    return ResponseEntity.ok(PagedResponse.of(members));
  }

  /**
   * Remove a member from organization
   * DELETE /api/v1/organization/members/{enrollmentId}
   *
   * @param userPrincipal Organization admin
   * @param enrollmentId  Enrollment ID
   * @return 204 No Content
   */
  @DeleteMapping("/{enrollmentId}")
  @PreAuthorize("hasRole('ORGANIZATION_ADMIN')")
  public ResponseEntity<Void> removeMember(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @PathVariable(name="enrollmentId") UUID enrollmentId) {
    UUID adminId = userPrincipal.getId();
    log.info("Organization admin {} removing member: {}", adminId, enrollmentId);

    orgEnrollmentService.removeMember(adminId, enrollmentId);

    return ResponseEntity.noContent().build();
  }

  /**
   * Get enrollment detail
   * GET /api/v1/organization/members/{enrollmentId}
   *
   * @param enrollmentId Enrollment ID
   * @return Enrollment detail
   */
  @GetMapping("/{enrollmentId}")
  @PreAuthorize("hasAnyRole('ORGANIZATION_ADMIN', 'READER')")
  public ResponseEntity<OrgEnrollmentResponse> getEnrollmentDetail(
      @PathVariable(name = "enrollmentId") UUID enrollmentId) {
    log.info("Get enrollment detail: {}", enrollmentId);

    OrgEnrollmentResponse enrollment = orgEnrollmentService.getEnrollmentDetail(enrollmentId);

    return ResponseEntity.ok(enrollment);
  }

  /**
   * Get member import batches for organization
   * GET /api/v1/organization/members/import-batches
   *
   * @param userPrincipal Organization admin
   * @param pageable      Pagination parameters
   * @return Paged response of import batches
   */
  @GetMapping("/import-batches")
  @PreAuthorize("hasRole('ORGANIZATION_ADMIN')")
  public ResponseEntity<PagedResponse<MemberImportBatchResponse>> getImportBatches(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      Pageable pageable) {
    UUID adminId = userPrincipal.getId();
    log.info("Get import batches for organization admin: {}", adminId);

    Page<MemberImportBatchResponse> batches = orgEnrollmentService.getImportBatches(
        adminId, pageable);

    return ResponseEntity.ok(PagedResponse.of(batches));
  }

  /**
   * Get successful enrollments for a specific import batch
   * GET /api/v1/organization/members/import-batches/{importBatchId}/enrollments
   *
   * @param userPrincipal Organization admin
   * @param importBatchId Import batch ID
   * @param pageable      Pagination parameters
   * @return Paged response of enrollments from this batch
   */
  @GetMapping("/import-batches/{importBatchId}/enrollments")
  @PreAuthorize("hasRole('ORGANIZATION_ADMIN')")
  public ResponseEntity<PagedResponse<OrgEnrollmentResponse>> getImportBatchEnrollments(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @PathVariable(name = "importBatchId") UUID importBatchId,
      Pageable pageable) {
    UUID adminId = userPrincipal.getId();
    log.info("Get enrollments for import batch: {}", importBatchId);

    Page<OrgEnrollmentResponse> enrollments = orgEnrollmentService.getImportBatchEnrollments(
        adminId, importBatchId, pageable);

    return ResponseEntity.ok(PagedResponse.of(enrollments));
  }

  /**
   * Update enrollment status
   * PUT /api/v1/organization/members/{enrollmentId}/status
   *
   * @param userPrincipal Organization admin
   * @param enrollmentId  Enrollment ID
   * @param request       Update status request
   * @return Updated enrollment detail
   */
  @PutMapping("/{enrollmentId}/status")
  @PreAuthorize("hasRole('ORGANIZATION_ADMIN')")
  public ResponseEntity<OrgEnrollmentResponse> updateEnrollmentStatus(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @PathVariable(name = "enrollmentId") UUID enrollmentId,
      @Valid @RequestBody UpdateEnrollStatusRequest request) {
    UUID adminId = userPrincipal.getId();
    log.info("Organization admin {} updating enrollment {} status to {}",
        adminId, enrollmentId, request.getStatus());

    OrgEnrollmentResponse response = orgEnrollmentService.updateEnrollmentStatus(
        adminId, enrollmentId, request.getStatus());

    return ResponseEntity.ok(response);
  }
}
