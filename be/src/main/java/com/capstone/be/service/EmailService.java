package com.capstone.be.service;

import java.util.UUID;
import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.domain.enums.UserStatus;

/**
 * Service for sending emails
 */
public interface EmailService {

  /**
   * Send email verification to user
   *
   * @param userId User ID
   * @param email  User email
   * @param token  Verification token
   */
  void sendEmailVerification(UUID userId, String email, String token);

  /**
   * Send welcome email after successful verification
   *
   * @param email    User email
   * @param fullName User full name
   */
  void sendWelcomeEmail(String email, String fullName);

  /**
   * Send rejection email to reviewer with reason
   *
   * @param email           Reviewer email
   * @param fullName        Reviewer full name
   * @param rejectionReason Reason for rejection
   */
  void sendReviewerRejectionEmail(String email, String fullName, String rejectionReason);

  /**
   * Send rejection email to organization admin with reason
   *
   * @param email           Organization admin email
   * @param fullName        Organization admin full name
   * @param rejectionReason Reason for rejection
   */
  void sendOrganizationRejectionEmail(String email, String fullName, String rejectionReason);

  /**
   * Send OTP to user's current email for email change verification
   *
   * @param userId      User ID
   * @param currentEmail Current email address
   * @param newEmail    New email address (for display in email)
   * @param otp         6-digit OTP code
   */
  void sendEmailChangeOtp(UUID userId, String currentEmail, String newEmail, String otp);

  /**
   * Send OTP to user's email for password reset verification
   *
   * @param email    User email address
   * @param fullName User full name
   * @param otp      6-digit OTP code
   */
  void sendPasswordResetOtp(String email, String fullName, String otp);

  /**
   * Send confirmation email after password reset successful
   *
   * @param email    User email address
   * @param fullName User full name
   */
  void sendPasswordResetConfirmation(String email, String fullName);

  /**
   * Send organization invitation to reader
   *
   * @param email            Reader email address
   * @param fullName         Reader full name
   * @param organizationName Organization name
   * @param enrollmentId     Enrollment ID for acceptance link
   */
  void sendOrganizationInvitation(String email, String fullName, String organizationName,
      UUID enrollmentId);

  /**
   * Send organization invitation with JWT token link
   *
   * @param email            Reader email address
   * @param fullName         Reader full name
   * @param organizationName Organization name
   * @param invitationToken  JWT token for invitation
   */
  void sendOrganizationInvitationWithToken(String email, String fullName, String organizationName,
      String invitationToken);

  /**
   * Send ticket status update email to guest or user
   *
   * @param email      Recipient email address
   * @param fullName   Recipient full name
   * @param ticketCode Ticket code for reference
   * @param status     New status of the ticket
   * @param adminNotes Optional admin notes/response
   */
  void sendTicketStatusUpdateEmail(String email, String fullName, String ticketCode,
      String status, String adminNotes);

  /**
   * Send invitation to create account and join organization For users who don't have an account
   * yet
   *
   * @param email            Recipient email address
   * @param organizationName Organization name
   */
  void sendAccountCreationInvitation(String email, String organizationName);

  /**
   * Send notification when a user's account status is changed by an admin.
   *
   * @param email      User email
   * @param fullName   User full name (optional)
   * @param newStatus  New account status
   * @param reason     Optional reason from admin
   */
  void sendUserStatusUpdateEmail(String email, String fullName, UserStatus newStatus, String reason);

  /**
   * Send notification when an organization admin account status is changed.
   *
   * @param email      Organization admin email
   * @param fullName   Organization admin full name (optional)
   * @param newStatus  New account status
   * @param reason     Optional reason from admin
   */
  void sendOrganizationStatusUpdateEmail(String email, String fullName, UserStatus newStatus, String reason);

  /**
   * Send notification to organization members when organization status is changed.
   *
   * @param email         Member email
   * @param fullName      Member full name (optional)
   * @param organizationName Organization name
   * @param newStatus     New organization status
   * @param reason        Optional reason from admin
   */
  void sendOrganizationMemberStatusUpdateEmail(
      String email,
      String fullName,
      String organizationName,
      UserStatus newStatus,
      String reason
  );

  /**
   * Send notification when a document status is changed by Business Admin.
   *
   * @param email         Uploader email
   * @param fullName      Uploader full name (optional)
   * @param documentTitle Document title
   * @param newStatus     New document status
   * @param reason        Optional reason from admin
   */
  void sendDocumentStatusUpdateEmail(
      String email,
      String fullName,
      String documentTitle,
      DocStatus newStatus,
      String reason
  );

  /**
   * Send notification when a user's role is changed by System Admin.
   *
   * @param email      User email
   * @param fullName   User full name (optional)
   * @param oldRole    Previous role
   * @param newRole    New role
   * @param reason     Optional reason from admin
   */
  void sendUserRoleChangeEmail(
      String email,
      String fullName,
      UserRole oldRole,
      UserRole newRole,
      String reason
  );
}
