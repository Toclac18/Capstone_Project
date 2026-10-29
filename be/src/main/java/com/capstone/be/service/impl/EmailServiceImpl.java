package com.capstone.be.service.impl;

import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.domain.enums.UserStatus;
import com.capstone.be.exception.EmailException;
import com.capstone.be.service.EmailService;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import com.capstone.be.service.helper.EmailTemplateRenderer;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

  private final JavaMailSender mailSender;
  private final EmailTemplateRenderer templates;

  @Value("${app.mail.from}")
  private String fromEmail;

  @Value("${app.mail.verificationBaseUrl}")
  private String verificationBaseUrl;

  @Value("${app.mail.joinOrganizationBaseUrl}")
  private String joinOrganizationBaseUrl;

  @Value("${app.mail.frontendBaseUrl}")
  private String frontendBaseUrl;

  @Override
  @Async
  public void sendEmailVerification(UUID userId, String email, String token) {
    try {
      String verificationUrl = String.format("%s?token=%s", verificationBaseUrl, token);

      String subject = "Verify Your Email - Capstone Platform";
      String htmlContent = buildVerificationEmailHtml(email, verificationUrl);

      sendHtmlEmail(email, subject, htmlContent);
      log.info("Sent verification email to: {}, [{}]", email, token);

    } catch (Exception e) {
      log.error("Failed to send verification email to: {}", email, e);
      throw EmailException.sendFailed(email, e);
    }
  }

  @Override
  @Async
  public void sendWelcomeEmail(String email, String fullName) {
    try {
      String subject = "Welcome to Capstone Platform!";
      String htmlContent = buildWelcomeEmailHtml(fullName);

      sendHtmlEmail(email, subject, htmlContent);
      log.info("Sent welcome email to: {}", email);

    } catch (Exception e) {
      log.error("Failed to send welcome email to: {}", email, e);
      // Don't throw exception for welcome email - it's not critical
    }
  }

  @Override
  @Async
  public void sendReviewerRejectionEmail(String email, String fullName, String rejectionReason) {
    try {
      String subject = "Reviewer Application Update - Capstone Platform";
      String htmlContent = buildRejectionEmailHtml(fullName, rejectionReason);

      sendHtmlEmail(email, subject, htmlContent);
      log.info("Sent rejection email to: {}", email);

    } catch (Exception e) {
      log.error("Failed to send rejection email to: {}", email, e);
      // Don't throw exception for rejection email - it's not critical
    }
  }

  private void sendHtmlEmail(String to, String subject, String htmlContent)
      throws MessagingException {
    MimeMessage message = mailSender.createMimeMessage();
    MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

    helper.setFrom(fromEmail);
    helper.setTo(to);
    helper.setSubject(subject);
    helper.setText(htmlContent, true);

    mailSender.send(message);
  }

  private String buildVerificationEmailHtml(String email, String verificationUrl) {
    return templates.render("verification-email", email, verificationUrl, verificationUrl);
  }

  private String buildWelcomeEmailHtml(String fullName) {
    return templates.render("welcome-email", fullName);
  }

  private String buildRejectionEmailHtml(String fullName, String rejectionReason) {
    return templates.render("rejection-email", fullName, rejectionReason);
  }

  @Override
  @Async
  public void sendOrganizationRejectionEmail(String email, String fullName,
      String rejectionReason) {
    try {
      String subject = "Organization Registration Update - Capstone Platform";
      String htmlContent = buildOrganizationRejectionEmailHtml(fullName, rejectionReason);

      sendHtmlEmail(email, subject, htmlContent);
      log.info("Sent organization rejection email to: {}", email);

    } catch (Exception e) {
      log.error("Failed to send organization rejection email to: {}", email, e);
      // Don't throw exception - it's not critical
    }
  }

  private String buildOrganizationRejectionEmailHtml(String fullName, String rejectionReason) {
    return templates.render("organization-rejection-email", fullName, rejectionReason);
  }

  @Override
  @Async
  public void sendEmailChangeOtp(UUID userId, String targetEmail, String newEmail, String otp) {
    try {
      String subject = "Email Change Verification - Capstone Platform";
      String htmlContent = buildEmailChangeOtpHtml(newEmail, otp);

      // Send OTP to target email (now it's the new email)
      sendHtmlEmail(targetEmail, subject, htmlContent);
      log.info("Sent email change OTP to: {} [{}]", targetEmail, otp);

    } catch (Exception e) {
      log.error("Failed to send email change OTP to: {}", targetEmail, e);
      throw EmailException.sendFailed(targetEmail, e);
    }
  }

  private String buildEmailChangeOtpHtml(String newEmail, String otp) {
    return templates.render("email-change-otp", newEmail, otp);
  }

  @Override
  @Async
  public void sendPasswordResetOtp(String email, String fullName, String otp) {
    try {
      String subject = "Password Reset Verification - Capstone Platform";
      String htmlContent = buildPasswordResetOtpHtml(fullName, otp);

      sendHtmlEmail(email, subject, htmlContent);
      log.info("Sent password reset OTP to: {} [{}]", email, otp);

    } catch (Exception e) {
      log.error("Failed to send password reset OTP to: {}", email, e);
      throw EmailException.sendFailed(email, e);
    }
  }

  private String buildPasswordResetOtpHtml(String fullName, String otp) {
    return templates.render("password-reset-otp", fullName, otp);
  }

  @Override
  @Async
  public void sendPasswordResetConfirmation(String email, String fullName) {
    try {
      String subject = "Password Reset Successful - Capstone Platform";
      String htmlContent = buildPasswordResetConfirmationHtml(fullName);

      sendHtmlEmail(email, subject, htmlContent);
      log.info("Sent password reset confirmation to: {}", email);

    } catch (Exception e) {
      log.error("Failed to send password reset confirmation to: {}", email, e);
      // Don't throw exception - it's not critical
    }
  }

  private String buildPasswordResetConfirmationHtml(String fullName) {
    return templates.render("password-reset-confirmation", fullName);
  }

  @Override
  @Async
  public void sendOrganizationInvitation(String email, String fullName, String organizationName,
      UUID enrollmentId) {
    try {
      String subject = "Organization Invitation - " + organizationName;
      String htmlContent = buildOrganizationInvitationHtml(fullName, organizationName,
          enrollmentId);

      sendHtmlEmail(email, subject, htmlContent);
      log.info("Sent organization invitation to: {} for organization: {}", email,
          organizationName);

    } catch (Exception e) {
      log.error("Failed to send organization invitation to: {}", email, e);
      throw EmailException.sendFailed(email, e);
    }
  }

  @Override
  @Async
  public void sendOrganizationInvitationWithToken(String email, String fullName,
      String organizationName, String invitationToken) {
    try {
      String subject = "Organization Invitation - " + organizationName;
      String htmlContent = buildOrganizationInvitationWithTokenHtml(fullName, organizationName,
          invitationToken);

      sendHtmlEmail(email, subject, htmlContent);
      log.info("Sent organization invitation with token to: {} for organization: {}", email,
          organizationName);

    } catch (Exception e) {
      log.error("Failed to send organization invitation with token to: {}", email, e);
      throw EmailException.sendFailed(email, e);
    }
  }

  private String buildOrganizationInvitationHtml(String fullName, String organizationName,
      UUID enrollmentId) {
    String acceptanceUrl = String.format(
        "%s?enrollmentId=%s",
        joinOrganizationBaseUrl, enrollmentId);

    return templates.render("organization-invitation", fullName, organizationName, organizationName, acceptanceUrl, acceptanceUrl);
  }

  private String buildOrganizationInvitationWithTokenHtml(String fullName, String organizationName,
      String invitationToken) {
    String acceptanceUrl = String.format(
        "%s?token=%s",
        joinOrganizationBaseUrl, invitationToken);

    return templates.render("organization-invitation-with-token", fullName, organizationName, organizationName, acceptanceUrl);
  }

  @Override
  @Async
  public void sendTicketStatusUpdateEmail(String email, String fullName, String ticketCode,
      String status, String adminNotes) {
    try {
      String subject = String.format("Ticket Update - %s - Capstone Platform", ticketCode);
      String htmlContent = buildTicketUpdateEmailHtml(fullName, ticketCode, status, adminNotes);

      sendHtmlEmail(email, subject, htmlContent);
      log.info("Sent ticket status update email to: {} for ticket: {}", email, ticketCode);

    } catch (Exception e) {
      log.error("Failed to send ticket status update email to: {} for ticket: {}", email,
          ticketCode, e);
      // Don't throw exception - it's not critical
    }
  }

  private String buildTicketUpdateEmailHtml(String fullName, String ticketCode, String status,
      String adminNotes) {
    String statusColor = switch (status.toUpperCase()) {
      case "IN_PROGRESS" -> "#2196F3";
      case "RESOLVED" -> "#4CAF50";
      case "CLOSED" -> "#9E9E9E";
      default -> "#FF9800";
    };

    String adminNotesSection = (adminNotes != null && !adminNotes.trim().isEmpty())
        ? templates.render("ticket-update-email-admin-notes-section", adminNotes)
        : "";

    return templates.render("ticket-update-email", statusColor, fullName, ticketCode, status, adminNotesSection);
  }

  @Override
  @Async
  public void sendAccountCreationInvitation(String email, String organizationName) {
    try {
      String subject = "Invitation to Join " + organizationName + " - Capstone Platform";
      String htmlContent = buildAccountCreationInvitationHtml(email, organizationName);

      sendHtmlEmail(email, subject, htmlContent);
      log.info("Sent account creation invitation to: {} for organization: {}", email,
          organizationName);

    } catch (Exception e) {
      log.error("Failed to send account creation invitation to: {}", email, e);
      // Don't throw exception - enrollment tracking is more important
    }
  }

  private String buildAccountCreationInvitationHtml(String email, String organizationName) {
    String registerUrl = verificationBaseUrl.replace("/verify-email", "/sign-up");

    return templates.render("account-creation-invitation", organizationName, organizationName, email, registerUrl, registerUrl, email);
  }

  @Override
  @Async
  public void sendUserStatusUpdateEmail(String email, String fullName, UserStatus newStatus, String reason) {
    try {
      String subject = "Account Status Updated - Capstone Platform";
      String htmlContent = buildUserStatusUpdateEmailHtml(fullName, newStatus, reason);

      sendHtmlEmail(email, subject, htmlContent);
      log.info("Sent user status update email to: {} with status: {}", email, newStatus);
    } catch (Exception e) {
      log.error("Failed to send user status update email to: {}", email, e);
    }
  }

  private String buildUserStatusUpdateEmailHtml(String fullName, UserStatus newStatus, String reason) {
    String displayName = (fullName != null && !fullName.isBlank()) ? fullName : "User";
    String statusLabel = newStatus != null ? newStatus.name() : "UPDATED";

    String reasonSection = (reason != null && !reason.trim().isEmpty())
        ? templates.render("user-status-update-email-reason-section", reason)
        : "";

    return templates.render("user-status-update-email", displayName, statusLabel, reasonSection);
  }

  @Override
  @Async
  public void sendOrganizationStatusUpdateEmail(String email, String fullName, UserStatus newStatus, String reason) {
    try {
      String subject = "Organization Account Status Updated - Capstone Platform";
      String htmlContent = buildOrganizationStatusUpdateEmailHtml(fullName, newStatus, reason);

      sendHtmlEmail(email, subject, htmlContent);
      log.info("Sent organization status update email to: {} with status: {}", email, newStatus);
    } catch (Exception e) {
      log.error("Failed to send organization status update email to: {}", email, e);
    }
  }

  private String buildOrganizationStatusUpdateEmailHtml(String fullName, UserStatus newStatus, String reason) {
    String displayName = (fullName != null && !fullName.isBlank()) ? fullName : "Organization Admin";
    String statusLabel = newStatus != null ? newStatus.name() : "UPDATED";

    String reasonSection = (reason != null && !reason.trim().isEmpty())
        ? templates.render("organization-status-update-email-reason-section", reason)
        : "";

    return templates.render("organization-status-update-email", displayName, statusLabel, reasonSection);
  }

  @Override
  @Async
  public void sendDocumentStatusUpdateEmail(
      String email,
      String fullName,
      String documentTitle,
      DocStatus newStatus,
      String reason
  ) {
    try {
      String subject = "Document Status Updated - Capstone Platform";
      String htmlContent = buildDocumentStatusUpdateEmailHtml(fullName, documentTitle, newStatus, reason);

      sendHtmlEmail(email, subject, htmlContent);
      log.info("Sent document status update email to: {} for document: {} with status: {}", email, documentTitle, newStatus);
    } catch (Exception e) {
      log.error("Failed to send document status update email to: {} for document: {}", email, documentTitle, e);
    }
  }

  private String buildDocumentStatusUpdateEmailHtml(
      String fullName,
      String documentTitle,
      DocStatus newStatus,
      String reason
  ) {
    String displayName = (fullName != null && !fullName.isBlank()) ? fullName : "User";
    String safeTitle = (documentTitle != null && !documentTitle.isBlank()) ? documentTitle : "Your document";
    
    // Determine colors and labels based on status
    String headerColor;
    String statusLabel;
    String statusEmoji;
    String mainMessage;
    String pointsText = "";
    
    if (newStatus == DocStatus.ACTIVE) {
      headerColor = "#4CAF50"; // Green
      statusLabel = "APPROVED";
      statusEmoji = "✅";
      mainMessage = "Great news! Your document has been approved and is now live on the platform.";
      // Extract points from reason if available
      if (reason != null && reason.contains("points")) {
        pointsText = reason;
      }
    } else if (newStatus == DocStatus.REJECTED) {
      headerColor = "#E53935"; // Red
      statusLabel = "REJECTED";
      statusEmoji = "❌";
      mainMessage = "Unfortunately, your document has been rejected after review.";
    } else if (newStatus == DocStatus.AI_REJECTED) {
      headerColor = "#FB8C00"; // Orange
      statusLabel = "NOT APPROVED";
      statusEmoji = "⚠️";
      mainMessage = "Your document could not be approved by our automated content review system.";
    } else {
      headerColor = "#1976D2"; // Blue (default)
      statusLabel = newStatus != null ? newStatus.name() : "UPDATED";
      statusEmoji = "📋";
      mainMessage = "The status of your document has been updated.";
    }

    // Build reason/details section
    String detailsSection = "";
    if (reason != null && !reason.trim().isEmpty()) {
      detailsSection = templates.render("document-status-update-email-details-section", reason);
    }

    // Build points reward section for approved documents
    String pointsSection = "";
    if (newStatus == DocStatus.ACTIVE && !pointsText.isEmpty()) {
      pointsSection = templates.load("document-status-update-email-points-section");
    }

    return templates.render(
        "document-status-update-email",
        headerColor,
        statusEmoji,
        statusLabel,
        displayName,
        mainMessage,
        safeTitle,
        detailsSection,
        pointsSection,
        frontendBaseUrl,
        headerColor);
  }

  @Override
  @Async
  public void sendUserRoleChangeEmail(
      String email,
      String fullName,
      UserRole oldRole,
      UserRole newRole,
      String reason
  ) {
    try {
      String subject = "Account Role Changed - Capstone Platform";
      String htmlContent = buildUserRoleChangeEmailHtml(fullName, oldRole, newRole, reason);

      sendHtmlEmail(email, subject, htmlContent);
      log.info("Sent user role change email to: {} from role: {} to role: {}", email, oldRole, newRole);
    } catch (Exception e) {
      log.error("Failed to send user role change email to: {}", email, e);
    }
  }

  private String buildUserRoleChangeEmailHtml(
      String fullName,
      UserRole oldRole,
      UserRole newRole,
      String reason
  ) {
    String displayName = (fullName != null && !fullName.isBlank()) ? fullName : "User";
    String oldRoleLabel = oldRole != null ? oldRole.getDisplayName() : "Previous Role";
    String newRoleLabel = newRole != null ? newRole.getDisplayName() : "New Role";

    String reasonSection = (reason != null && !reason.trim().isEmpty())
        ? templates.render("user-role-change-email-reason-section", reason)
        : "";

    return templates.render("user-role-change-email", displayName, oldRoleLabel, newRoleLabel, reasonSection);
  }

  @Override
  @Async
  public void sendOrganizationMemberStatusUpdateEmail(
      String email,
      String fullName,
      String organizationName,
      UserStatus newStatus,
      String reason
  ) {
    try {
      String subject = "Organization Status Update - Capstone Platform";
      String htmlContent = buildOrganizationMemberStatusUpdateEmailHtml(fullName, organizationName, newStatus, reason);

      sendHtmlEmail(email, subject, htmlContent);
      log.info("Sent organization member status update email to: {} for organization: {} with status: {}", 
          email, organizationName, newStatus);
    } catch (Exception e) {
      log.error("Failed to send organization member status update email to: {} for organization: {}", 
          email, organizationName, e);
    }
  }

  private String buildOrganizationMemberStatusUpdateEmailHtml(
      String fullName,
      String organizationName,
      UserStatus newStatus,
      String reason
  ) {
    String displayName = (fullName != null && !fullName.isBlank()) ? fullName : "Member";
    String orgName = (organizationName != null && !organizationName.isBlank()) ? organizationName : "Your Organization";
    String statusLabel = newStatus != null ? newStatus.name() : "UPDATED";

    // Determine message and color based on status
    String statusMessage;
    String headerColor;
    if (newStatus == UserStatus.ACTIVE) {
      statusMessage = "Your organization has been activated. You can now access all organization features and documents.";
      headerColor = "#4CAF50"; // Green
    } else if (newStatus == UserStatus.INACTIVE) {
      statusMessage = "Your organization has been deactivated. Access to organization features may be limited.";
      headerColor = "#FF9800"; // Orange
    } else {
      statusMessage = "The status of your organization has been updated.";
      headerColor = "#2196F3"; // Blue
    }

    String reasonSection = (reason != null && !reason.trim().isEmpty())
        ? templates.render("organization-member-status-update-email-reason-section", reason)
        : "";

    return templates.render("organization-member-status-update-email", headerColor, headerColor, displayName, orgName, statusLabel, statusMessage, reasonSection);
  }
}

