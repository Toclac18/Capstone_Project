package com.capstone.be.controller;

import com.capstone.be.dto.common.PagedResponse;
import com.capstone.be.dto.response.organization.OrgEnrollmentResponse;
import com.capstone.be.security.model.UserPrincipal;
import com.capstone.be.service.OrgEnrollmentService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for reader to manage organization invitations and enrollments
 */
@Slf4j
@RestController
@RequestMapping("/reader/enrollments")
@RequiredArgsConstructor
@PreAuthorize("hasRole('READER')")
public class ReaderEnrollmentController {

  private final OrgEnrollmentService orgEnrollmentService;

  /**
   * Get pending invitations for the authenticated reader
   * GET /api/v1/reader/enrollments/invitations
   *
   * @param userPrincipal Reader
   * @param pageable      Pagination parameters
   * @return Paged response of pending invitations
   */
  @GetMapping("/invitations")
  public ResponseEntity<PagedResponse<OrgEnrollmentResponse>> getMyPendingInvitations(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      Pageable pageable) {
    UUID readerId = userPrincipal.getId();
    log.info("Get pending invitations for reader: {}", readerId);

    Page<OrgEnrollmentResponse> invitations = orgEnrollmentService.getMyPendingInvitations(
        readerId, pageable);

    return ResponseEntity.ok(PagedResponse.of(invitations));
  }

  /**
   * Get joined organizations for the authenticated reader
   * GET /api/v1/reader/enrollments/organizations
   *
   * @param userPrincipal Reader
   * @param pageable      Pagination parameters
   * @return Paged response of joined organizations
   */
  @GetMapping("/organizations")
  public ResponseEntity<PagedResponse<OrgEnrollmentResponse>> getMyOrganizations(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @PageableDefault(sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
    UUID readerId = userPrincipal.getId();
    log.info("Get joined organizations for reader: {}", readerId);

    Page<OrgEnrollmentResponse> organizations =
        orgEnrollmentService.getMyOrganizations(readerId, pageable);

    return ResponseEntity.ok(PagedResponse.of(organizations));
  }

  /**
   * Accept organization invitation
   * POST /api/v1/reader/enrollments/{enrollmentId}/accept
   *
   * @param userPrincipal Reader
   * @param enrollmentId  Enrollment ID
   * @return 200 OK with message
   */
  @PostMapping("/{enrollmentId}/accept")
  public ResponseEntity<String> acceptInvitation(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @PathVariable(name="enrollmentId") UUID enrollmentId) {
    UUID readerId = userPrincipal.getId();
    log.info("Reader {} accepting invitation: {}", readerId, enrollmentId);

    orgEnrollmentService.acceptInvitation(readerId, enrollmentId);

    return ResponseEntity.ok("Invitation accepted successfully");
  }

  /**
   * Reject organization invitation
   * POST /api/v1/reader/enrollments/{enrollmentId}/reject
   *
   * @param userPrincipal Reader
   * @param enrollmentId  Enrollment ID
   * @return 200 OK with message
   */
  @PostMapping("/{enrollmentId}/reject")
  public ResponseEntity<String> rejectInvitation(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @PathVariable(name="enrollmentId") UUID enrollmentId) {
    UUID readerId = userPrincipal.getId();
    log.info("Reader {} rejecting invitation: {}", readerId, enrollmentId);

    orgEnrollmentService.rejectInvitation(readerId, enrollmentId);

    return ResponseEntity.ok("Invitation rejected successfully");
  }

  /**
   * Leave an organization
   * POST /api/v1/reader/enrollments/organizations/{organizationId}/leave
   *
   * @param userPrincipal  Reader
   * @param organizationId Organization ID
   * @return 200 OK with message
   */
  @PostMapping("/organizations/{organizationId}/leave")
  public ResponseEntity<String> leaveOrganization(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @PathVariable(name = "organizationId") UUID organizationId) {
    UUID readerId = userPrincipal.getId();
    log.info("Reader {} leaving organization: {}", readerId, organizationId);

    orgEnrollmentService.leaveOrganization(readerId, organizationId);

    return ResponseEntity.ok("Successfully left the organization");
  }
}
