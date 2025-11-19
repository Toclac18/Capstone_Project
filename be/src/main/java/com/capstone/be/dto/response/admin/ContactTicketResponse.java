    package com.capstone.be.dto.response.admin;

import com.capstone.be.domain.enums.ContactCategory;
import com.capstone.be.domain.enums.ContactStatus;
import com.capstone.be.domain.enums.ContactUrgency;
import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for contact ticket (for frontend compatibility)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ContactTicketResponse {

  private UUID ticketId;
  private String ticketCode;
  private ContactStatus status;
  private String message;

  // Full ticket details (for admin view)
  private String name;
  private String email;
  private ContactCategory category;
  private String otherCategory;
  private ContactUrgency urgency;
  private String subject;
  private String ticketMessage;
  private String ipAddress;
  private String adminNotes;
  private Instant createdAt;
  private Instant updatedAt;

  /**
   * Create a simple response (for ticket creation)
   */
  public static ContactTicketResponse ofSimple(UUID ticketId, String ticketCode,
      ContactStatus status, String message) {
    return ContactTicketResponse.builder()
        .ticketId(ticketId)
        .ticketCode(ticketCode)
        .status(status)
        .message(message)
        .build();
  }
}
