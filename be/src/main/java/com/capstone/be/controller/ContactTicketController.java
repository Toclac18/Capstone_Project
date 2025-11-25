
package com.capstone.be.controller;

import com.capstone.be.domain.enums.ContactStatus;
import com.capstone.be.dto.common.PagedResponse;
import com.capstone.be.dto.request.admin.CreateContactTicketRequest;
import com.capstone.be.dto.request.admin.UpdateContactTicketRequest;
import com.capstone.be.dto.response.admin.ContactTicketResponse;
import com.capstone.be.service.ContactTicketService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Controller for contact ticket operations
 * NOTE: By Default, Endpoints in this Controller are public, use @PreAuthorize to authorize
 */
@Slf4j
@RestController
@RequestMapping("/contact-tickets")
@RequiredArgsConstructor
@Tag(name = "Contact Tickets", description = "APIs for contact ticket management")
public class ContactTicketController {

  private final ContactTicketService contactTicketService;

  /**
   * Create a new contact ticket (public endpoint)
   * POST /api/contact-admin
   *
   * @param request     Ticket creation request
   * @param httpRequest HTTP request to extract IP address
   * @return Created ticket response
   */
  @PostMapping
  @Operation(summary = "Create a contact ticket", description = "Submit a support ticket to admin (public endpoint)")
  public ResponseEntity<ContactTicketResponse> createTicket(
      @Valid @RequestBody CreateContactTicketRequest request,
      HttpServletRequest httpRequest) {

    String ipAddress = extractIpAddress(httpRequest);
    log.info("Creating contact ticket from IP: {}", ipAddress);

    ContactTicketResponse response = contactTicketService.createTicket(request, ipAddress);

    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }

  /**
   * Get ticket by code (public endpoint for users)
   * GET /api/v1/contact-tickets/code/{ticketCode}
   *
   * @param ticketCode Ticket code
   * @return Ticket details
   */
  @GetMapping("/code/{ticketCode}")
  @Operation(summary = "Get ticket by code",
             description = "Get contact ticket details by ticket code (public endpoint)")
  public ResponseEntity<ContactTicketResponse> getTicketByCode(
      @PathVariable(name = "ticketCode") String ticketCode) {

    log.info("User fetching ticket by code: {}", ticketCode);

    ContactTicketResponse response = contactTicketService.getTicketByCode(ticketCode);

    return ResponseEntity.ok(response);
  }

  /**
   * Get ticket by ID (admin only)
   * GET /api/v1/contact-tickets/{ticketId}
   *
   * @param ticketId Ticket ID
   * @return Ticket details
   */
  @GetMapping("/{ticketId}")
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  @Operation(summary = "Get ticket by ID (admin only)",
             description = "Get contact ticket details by ID")
  public ResponseEntity<ContactTicketResponse> getTicketById(
      @PathVariable(name = "ticketId") UUID ticketId) {

    log.info("Admin fetching ticket by ID: {}", ticketId);

    ContactTicketResponse response = contactTicketService.getTicketById(ticketId);

    return ResponseEntity.ok(response);
  }

  /**
   * Get tickets with dynamic filters (admin only)
   * GET /api/v1/contact-tickets
   *
   * Supports dynamic filtering and sorting:
   * - GET /api/v1/contact-tickets - get all tickets (default: sorted by createdAt DESC)
   * - GET /api/v1/contact-tickets?status=NEW - filter by status
   * - GET /api/v1/contact-tickets?email=user@example.com - filter by email (partial match)
   * - GET /api/v1/contact-tickets?status=NEW&email=user - combine multiple filters
   * - GET /api/v1/contact-tickets?sort=email,asc&sort=createdAt,desc - custom sorting
   *
   * @param status   Optional status filter
   * @param email    Optional email filter (case-insensitive partial match)
   * @param pageable Pagination and sorting parameters
   * @return Page of tickets
   */
  @GetMapping
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  @Operation(summary = "Get tickets with filters (admin only)",
             description = "Get contact tickets with dynamic filters (status, email) and custom sorting. " +
                 "All filters are optional and can be combined.")
  public ResponseEntity<PagedResponse<ContactTicketResponse>> getTicketsWithFilters(
      @RequestParam(name = "status", required = false) ContactStatus status,
      @RequestParam(name = "email", required = false) String email,
      @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

    log.info("Admin fetching tickets with filters - status: {}, email: {}, pagination: {}",
        status, email, pageable);

    Page<ContactTicketResponse> page = contactTicketService.getTicketsWithFilters(status, email,
        pageable);

    return ResponseEntity.ok(PagedResponse.of(page));
  }

  /**
   * Update ticket (admin only) - unified endpoint for status and/or admin notes
   * PATCH /api/v1/contact-tickets/{ticketId}
   *
   * @param ticketId Ticket ID
   * @param request  Update request (status and/or adminNotes)
   * @return Updated ticket
   */
  @PatchMapping("/{ticketId}")
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  @Operation(summary = "Update ticket",
             description = "Update contact ticket status and/or admin notes (admin only). Both fields are optional.")
  public ResponseEntity<ContactTicketResponse> updateTicket(
      @PathVariable(name = "ticketId") UUID ticketId,
      @Valid @RequestBody UpdateContactTicketRequest request) {

    log.info("Admin updating ticket: {} with request: {}", ticketId, request);

    ContactTicketResponse response = contactTicketService.updateTicket(ticketId, request);

    return ResponseEntity.ok(response);
  }
  

  /**
   * Delete ticket (admin only)
   * DELETE /api/v1/contact-tickets/{ticketId}
   *
   * @param ticketId Ticket ID
   * @return No content
   */
  @DeleteMapping("/{ticketId}")
  @PreAuthorize("hasRole('BUSINESS_ADMIN')")
  @Operation(summary = "Delete ticket", description = "Delete contact ticket (admin only)")
  public ResponseEntity<Void> deleteTicket(
      @PathVariable(name = "ticketId") UUID ticketId) {

    log.info("Admin deleting ticket: {}", ticketId);

    contactTicketService.deleteTicket(ticketId);

    return ResponseEntity.noContent().build();
  }

  /**
   * Extract IP address from HTTP request
   */
  private String extractIpAddress(HttpServletRequest request) {
    String ipAddress = request.getHeader("X-Forwarded-For");
    if (ipAddress == null || ipAddress.isEmpty()) {
      ipAddress = request.getHeader("X-Real-IP");
    }
    if (ipAddress == null || ipAddress.isEmpty()) {
      ipAddress = request.getRemoteAddr();
    }
    // Take first IP if there are multiple (proxy chain)
    if (ipAddress != null && ipAddress.contains(",")) {
      ipAddress = ipAddress.split(",")[0].trim();
    }
    return ipAddress;
  }
}
