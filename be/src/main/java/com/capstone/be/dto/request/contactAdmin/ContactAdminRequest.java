package com.capstone.be.dto.request.contactAdmin;

import com.capstone.be.domain.enums.TicketCategory;
import com.capstone.be.domain.enums.TicketUrgency;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class ContactAdminRequest {

  @NotBlank
  @Size(max = 120)
  private String name;

  @NotBlank
  @Email
  @Size(max = 180)
  private String email;

  @NotBlank
  @Size(max = 160)
  private String subject;

  @NotBlank
  @Size(max = 5000)
  private String message;

  private TicketCategory category = TicketCategory.OTHER;

  private TicketUrgency urgency = TicketUrgency.NORMAL;
}