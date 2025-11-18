package com.capstone.be.dto.request.admin;

import com.capstone.be.domain.enums.ContactStatus;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating a contact ticket
 * Both fields are optional - only non-null fields will be updated
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateContactTicketRequest {

  private ContactStatus status;

  @Size(max = 5000, message = "Admin notes must not exceed 5000 characters")
  private String adminNotes;
}
