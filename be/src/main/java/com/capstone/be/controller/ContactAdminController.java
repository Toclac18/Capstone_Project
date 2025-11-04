package com.capstone.be.controller;

import com.capstone.be.dto.request.contactAdmin.ContactAdminRequest;
import com.capstone.be.dto.response.ContactAdminResponse;
import com.capstone.be.service.ContactAdminService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("api/contact-admin")
public class ContactAdminController {

  private final ContactAdminService contactAdminService;

  public ContactAdminController(ContactAdminService contactAdminService) {
    this.contactAdminService = contactAdminService;
  }

  /**
   * Creates a new Ticket resource from a contact request. RESTful standard: Use HTTP 201 CREATED
   * and return the created resource in the body.
   */
  @PostMapping
  public ResponseEntity<ContactAdminResponse> submit(
      @Valid @RequestBody ContactAdminRequest request) {

    // 1. Call the service layer to create the resource
    ContactAdminResponse createdTicket = contactAdminService.createTicket(request);

    // 2. Return HTTP 201 CREATED status with the created resource DTO in the body.
    return ResponseEntity.status(HttpStatus.CREATED).body(createdTicket);
  }
}
