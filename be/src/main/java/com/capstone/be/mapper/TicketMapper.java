package com.capstone.be.mapper;

import com.capstone.be.domain.entity.Ticket;
import com.capstone.be.dto.request.contactAdmin.ContactAdminRequest;
import java.time.LocalDateTime;
import org.mapstruct.AfterMapping;
import org.mapstruct.Builder;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring", builder = @Builder(disableBuilder = true))
public interface TicketMapper {

  @Mapping(target = "ticketId", ignore = true)
  @Mapping(target = "ticketCode", expression = "java(generateTicketCode())")
  @Mapping(target = "requesterUserId", ignore = true)
  @Mapping(target = "requesterName", source = "name")
  @Mapping(target = "requesterEmail", source = "email")
  @Mapping(target = "subject", source = "subject")
  @Mapping(target = "message", source = "message")
  @Mapping(target = "category", source = "category")
  @Mapping(target = "urgency", source = "urgency")
  @Mapping(target = "status", constant = "OPEN")
  @Mapping(target = "assignedTo", ignore = true)
  @Mapping(target = "closedAt", ignore = true)
  Ticket toTicket(ContactAdminRequest req);

  default String generateTicketCode() {
    String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    StringBuilder sb = new StringBuilder("TKT-");
    java.util.Random rnd = new java.util.Random();
      for (int i = 0; i < 8; i++) {
          sb.append(chars.charAt(rnd.nextInt(chars.length())));
      }
    return sb.toString();
  }

  @AfterMapping
  default void ensureTimestamps(@MappingTarget Ticket t) {
      if (t.getCreatedAt() == null) {
          t.setCreatedAt(LocalDateTime.now());
      }
      if (t.getUpdatedAt() == null) {
          t.setUpdatedAt(LocalDateTime.now());
      }
  }
}
