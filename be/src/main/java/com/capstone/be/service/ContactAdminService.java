package com.capstone.be.service;

import com.capstone.be.dto.request.ContactAdminRequest;
import com.capstone.be.dto.response.ContactAdminResponse;

/**
 * Defines the contract for handling user contact requests (tickets) directed to administrators.
 */
public interface ContactAdminService {

    /**
     * Creates a new support ticket based on the user's contact request.
     *
     * @param req The request DTO containing contact details and message.
     * @return A response DTO confirming the ticket creation.
     */
    ContactAdminResponse createTicket(ContactAdminRequest req);
}