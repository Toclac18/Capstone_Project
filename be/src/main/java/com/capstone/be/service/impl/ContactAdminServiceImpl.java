package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.Ticket;
import com.capstone.be.domain.entity.TicketMessage;
import com.capstone.be.domain.enums.MsgAuthorType;
import com.capstone.be.dto.request.ContactAdminRequest;
import com.capstone.be.dto.response.ContactAdminResponse;
import com.capstone.be.mapper.TicketMapper;
import com.capstone.be.repository.TicketMessageRepository;
import com.capstone.be.repository.TicketRepository;
import com.capstone.be.service.ContactAdminService; // Import the new interface
import lombok.extern.slf4j.Slf4j; // Optional: for logging
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service // Spring context recognizes this as a service bean
@Slf4j
public class ContactAdminServiceImpl implements ContactAdminService { // Implement the interface

    private final TicketRepository ticketRepo;
    private final TicketMessageRepository messageRepo;
    private final TicketMapper mapper;

    // Use constructor injection for dependencies
    public ContactAdminServiceImpl(TicketRepository ticketRepo, TicketMessageRepository messageRepo, TicketMapper mapper) {
        this.ticketRepo = ticketRepo;
        this.messageRepo = messageRepo;
        this.mapper = mapper;
    }

    @Override // Implementing the method from the interface
    @Transactional
    public ContactAdminResponse createTicket(ContactAdminRequest req) {
        log.info("Attempting to create a new ticket from request: {}", req.getSubject());

        // 1. Map DTO to Ticket entity
        Ticket t = mapper.toTicket(req);

        // 2. Save the new ticket entity
        Ticket savedTicket = ticketRepo.save(t);
        log.debug("Ticket saved successfully with ID: {}", savedTicket.getTicketId());

        // 3. Create the initial message entity
        TicketMessage initialMessage = TicketMessage.builder()
                .ticketId(savedTicket.getTicketId())
                .authorType(MsgAuthorType.USER)
                .authorUserId(null)
                .body(req.getMessage())
                .build();

        // 4. Save the initial message
        messageRepo.save(initialMessage);
        log.debug("Initial message saved for ticket ID: {}", savedTicket.getTicketId());

        // 5. Map and return the response DTO
        // NOTE: Adjusted to use ContactAdminResponse as the return type for consistency,
        // and assuming your ContactResponse class implements/extends ContactAdminResponse.
        return new ContactAdminResponse(
                savedTicket.getTicketId().toString(),
                savedTicket.getTicketCode(),
                savedTicket.getStatus().name(),
                "Your message has been received. We'll get back to you shortly."
        );
    }
}