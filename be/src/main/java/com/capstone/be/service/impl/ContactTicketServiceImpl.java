    package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.ContactTicket;
import com.capstone.be.domain.enums.ContactStatus;
import com.capstone.be.dto.request.admin.CreateContactTicketRequest;
import com.capstone.be.dto.request.admin.UpdateContactTicketRequest;
import com.capstone.be.dto.response.admin.ContactTicketResponse;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.mapper.ContactTicketMapper;
import com.capstone.be.repository.ContactTicketRepository;
import com.capstone.be.repository.specification.ContactTicketSpecification;
import com.capstone.be.service.ContactTicketService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Implementation of ContactTicketService
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ContactTicketServiceImpl implements ContactTicketService {

  private final ContactTicketRepository contactTicketRepository;
  private final ContactTicketMapper contactTicketMapper;

  @Override
  @Transactional
  public ContactTicketResponse createTicket(CreateContactTicketRequest request,
      String ipAddress) {
    log.info("Creating contact ticket for email: {}", request.getEmail());

    ContactTicket ticket = contactTicketMapper.toEntity(request);
    ticket.setIpAddress(ipAddress);
    ticket.setStatus(ContactStatus.NEW);

    ContactTicket savedTicket = contactTicketRepository.save(ticket);

    log.info("Contact ticket created successfully: {}", savedTicket.getTicketCode());

    // Return simple response for ticket creation (matching frontend expectation)
    return ContactTicketResponse.ofSimple(
        savedTicket.getId(),
        savedTicket.getTicketCode(),
        savedTicket.getStatus(),
        "Your message has been received. We will get back to you soon."
    );
  }

  @Override
  @Transactional(readOnly = true)
  public ContactTicketResponse getTicketById(UUID ticketId) {
    log.info("Fetching ticket by ID: {}", ticketId);

    ContactTicket ticket = contactTicketRepository.findById(ticketId)
        .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with ID: " + ticketId));

    return contactTicketMapper.toResponse(ticket);
  }

  @Override
  @Transactional(readOnly = true)
  public ContactTicketResponse getTicketByCode(String ticketCode) {
    log.info("Fetching ticket by code: {}", ticketCode);

    ContactTicket ticket = contactTicketRepository.findByTicketCode(ticketCode)
        .orElseThrow(
            () -> new ResourceNotFoundException("Ticket not found with code: " + ticketCode));

    return contactTicketMapper.toResponse(ticket);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<ContactTicketResponse> getTicketsWithFilters(ContactStatus status, String email,
      Pageable pageable) {
    log.info("Fetching tickets with filters - status: {}, email: {}, pagination: {}",
        status, email, pageable);

    Specification<ContactTicket> spec = ContactTicketSpecification.withFilters(status, email);

    return contactTicketRepository.findAll(spec, pageable)
        .map(contactTicketMapper::toResponse);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<ContactTicketResponse> getAllTickets(Pageable pageable) {
    log.info("Fetching all tickets with pagination: {}", pageable);

    return contactTicketRepository.findAll(pageable)
        .map(contactTicketMapper::toResponse);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<ContactTicketResponse> getTicketsByStatus(ContactStatus status, Pageable pageable) {
    log.info("Fetching tickets by status: {} with pagination: {}", status, pageable);

    return contactTicketRepository.findByStatus(status, pageable)
        .map(contactTicketMapper::toResponse);
  }

  @Override
  @Transactional(readOnly = true)
  public Page<ContactTicketResponse> getTicketsByEmail(String email, Pageable pageable) {
    log.info("Fetching tickets by email: {} with pagination: {}", email, pageable);

    return contactTicketRepository.findByEmail(email, pageable)
        .map(contactTicketMapper::toResponse);
  }

  @Override
  @Transactional
  public ContactTicketResponse updateTicket(UUID ticketId, UpdateContactTicketRequest request) {
    log.info("Updating ticket: {} with request: {}", ticketId, request);

    ContactTicket ticket = contactTicketRepository.findById(ticketId)
        .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with ID: " + ticketId));

    // Update only non-null fields
    if (request.getStatus() != null) {
      ticket.setStatus(request.getStatus());
      log.info("Updated ticket {} status to: {}", ticketId, request.getStatus());
    }
    if (request.getAdminNotes() != null) {
      ticket.setAdminNotes(request.getAdminNotes());
      log.info("Updated ticket {} admin notes", ticketId);
    }

    ContactTicket updatedTicket = contactTicketRepository.save(ticket);

    log.info("Ticket updated successfully: {}", updatedTicket.getTicketCode());

    return contactTicketMapper.toResponse(updatedTicket);
  }

  @Override
  @Transactional
  public ContactTicketResponse updateTicketStatus(UUID ticketId, ContactStatus status) {
    log.info("Updating ticket {} status to: {}", ticketId, status);

    ContactTicket ticket = contactTicketRepository.findById(ticketId)
        .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with ID: " + ticketId));

    ticket.setStatus(status);
    ContactTicket updatedTicket = contactTicketRepository.save(ticket);

    log.info("Ticket status updated successfully: {}", updatedTicket.getTicketCode());

    return contactTicketMapper.toResponse(updatedTicket);
  }

  @Override
  @Transactional
  public ContactTicketResponse addAdminNotes(UUID ticketId, String adminNotes) {
    log.info("Adding admin notes to ticket: {}", ticketId);

    ContactTicket ticket = contactTicketRepository.findById(ticketId)
        .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with ID: " + ticketId));

    ticket.setAdminNotes(adminNotes);
    ContactTicket updatedTicket = contactTicketRepository.save(ticket);

    log.info("Admin notes added successfully to ticket: {}", updatedTicket.getTicketCode());

    return contactTicketMapper.toResponse(updatedTicket);
  }

  @Override
  @Transactional
  public void deleteTicket(UUID ticketId) {
    log.info("Deleting ticket: {}", ticketId);

    ContactTicket ticket = contactTicketRepository.findById(ticketId)
        .orElseThrow(() -> new ResourceNotFoundException("Ticket not found with ID: " + ticketId));

    contactTicketRepository.delete(ticket);

    log.info("Ticket deleted successfully: {}", ticket.getTicketCode());
  }
}
