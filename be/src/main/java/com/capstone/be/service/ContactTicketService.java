    package com.capstone.be.service;

import com.capstone.be.domain.enums.ContactStatus;
import com.capstone.be.dto.request.admin.CreateContactTicketRequest;
import com.capstone.be.dto.request.admin.UpdateContactTicketRequest;
import com.capstone.be.dto.response.admin.ContactTicketResponse;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Service interface for contact ticket operations
 */
public interface ContactTicketService {

  /**
   * Create a new contact ticket
   *
   * @param request   Ticket creation request
   * @param ipAddress IP address of the requester
   * @return Created ticket response
   */
  ContactTicketResponse createTicket(CreateContactTicketRequest request, String ipAddress);

  /**
   * Get ticket by ID (admin only)
   *
   * @param ticketId Ticket ID
   * @return Ticket details
   */
  ContactTicketResponse getTicketById(UUID ticketId);

  /**
   * Get ticket by ticket code
   *
   * @param ticketCode Ticket code
   * @return Ticket details
   */
  ContactTicketResponse getTicketByCode(String ticketCode);

  /**
   * Get tickets with filters (admin only) - using Specification for dynamic filtering
   *
   * @param status   Optional ticket status filter
   * @param email    Optional email filter
   * @param pageable Pagination and sorting parameters
   * @return Page of tickets
   */
  Page<ContactTicketResponse> getTicketsWithFilters(ContactStatus status, String email,
      Pageable pageable);

  /**
   * Get all tickets with pagination (admin only)
   *
   * @param pageable Pagination parameters
   * @return Page of tickets
   * @deprecated Use {@link #getTicketsWithFilters(ContactStatus, String, Pageable)} instead
   */
  @Deprecated
  Page<ContactTicketResponse> getAllTickets(Pageable pageable);

  /**
   * Get tickets by status (admin only)
   *
   * @param status   Ticket status
   * @param pageable Pagination parameters
   * @return Page of tickets
   * @deprecated Use {@link #getTicketsWithFilters(ContactStatus, String, Pageable)} instead
   */
  @Deprecated
  Page<ContactTicketResponse> getTicketsByStatus(ContactStatus status, Pageable pageable);

  /**
   * Get tickets by email
   *
   * @param email    User email
   * @param pageable Pagination parameters
   * @return Page of tickets
   * @deprecated Use {@link #getTicketsWithFilters(ContactStatus, String, Pageable)} instead
   */
  @Deprecated
  Page<ContactTicketResponse> getTicketsByEmail(String email, Pageable pageable);

  /**
   * Update ticket (admin only) - unified update method
   *
   * @param ticketId Ticket ID
   * @param request  Update request with optional status and adminNotes
   * @return Updated ticket
   */
  ContactTicketResponse updateTicket(UUID ticketId, UpdateContactTicketRequest request);

  /**
   * Update ticket status (admin only)
   * @deprecated Use {@link #updateTicket(UUID, UpdateContactTicketRequest)} instead
   *
   * @param ticketId Ticket ID
   * @param status   New status
   * @return Updated ticket
   */
  @Deprecated
  ContactTicketResponse updateTicketStatus(UUID ticketId, ContactStatus status);

  /**
   * Add admin notes to ticket (admin only)
   * @deprecated Use {@link #updateTicket(UUID, UpdateContactTicketRequest)} instead
   *
   * @param ticketId   Ticket ID
   * @param adminNotes Admin notes
   * @return Updated ticket
   */
  @Deprecated
  ContactTicketResponse addAdminNotes(UUID ticketId, String adminNotes);

  /**
   * Delete ticket (admin only)
   *
   * @param ticketId Ticket ID
   */
  void deleteTicket(UUID ticketId);
}
