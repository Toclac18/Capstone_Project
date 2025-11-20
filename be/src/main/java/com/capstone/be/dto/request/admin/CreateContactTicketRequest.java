    package com.capstone.be.dto.request.admin;

import com.capstone.be.domain.enums.ContactCategory;
import com.capstone.be.domain.enums.ContactUrgency;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating a contact ticket
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateContactTicketRequest {

  @NotBlank(message = "Name is required")
  @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
  private String name;

  @NotBlank(message = "Email is required")
  @Email(message = "Email must be valid")
  @Size(max = 255, message = "Email must not exceed 255 characters")
  private String email;

  @NotNull(message = "Category is required")
  private ContactCategory category;

  @Size(max = 100, message = "Other category must not exceed 100 characters")
  private String otherCategory;

  @NotNull(message = "Urgency is required")
  private ContactUrgency urgency;

  @NotBlank(message = "Subject is required")
  @Size(min = 3, max = 500, message = "Subject must be between 3 and 500 characters")
  private String subject;

  @NotBlank(message = "Message is required")
  @Size(min = 10, message = "Message must be at least 10 characters")
  private String message;
}
