package com.capstone.be.dto.request.organization;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotEmpty;
import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for inviting members (readers) to organization
 * Can be used for both single and bulk invitations
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InviteMembersRequest {

  /**
   * List of email addresses to invite
   */
  @NotEmpty(message = "At least one email is required")
  private List<@Email(message = "Invalid email format") String> emails;
}
