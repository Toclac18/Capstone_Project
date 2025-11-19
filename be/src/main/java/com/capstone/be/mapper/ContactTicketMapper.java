    package com.capstone.be.mapper;

import com.capstone.be.domain.entity.ContactTicket;
import com.capstone.be.dto.request.admin.CreateContactTicketRequest;
import com.capstone.be.dto.response.admin.ContactTicketResponse;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

/**
 * Mapper for ContactTicket entity and DTOs
 */
@Mapper(componentModel = "spring")
public interface ContactTicketMapper {

  /**
   * Convert CreateContactTicketRequest to ContactTicket entity
   */
  ContactTicket toEntity(CreateContactTicketRequest request);

  /**
   * Convert ContactTicket entity to ContactTicketResponse
   */
  @Mapping(source = "id", target = "ticketId")
  @Mapping(source = "message", target = "ticketMessage")
  ContactTicketResponse toResponse(ContactTicket ticket);
}
