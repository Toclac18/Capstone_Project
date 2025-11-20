package com.capstone.be.dto.response.organization;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for bulk member invitation
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InviteMembersResponse {

  /**
   * Total emails processed
   */
  private int totalEmails;

  /**
   * Successfully invited emails
   */
  private int successCount;
  private List<String> successEmails;

  /**
   * Failed invitations
   */
  private int failedCount;
  private List<FailedInvitation> failedInvitations;

  /**
   * Skipped (already invited/joined)
   */
  private int skippedCount;
  private List<String> skippedEmails;

  @Data
  @Builder
  @NoArgsConstructor
  @AllArgsConstructor
  public static class FailedInvitation {
    private String email;
    private String reason;
  }
}
