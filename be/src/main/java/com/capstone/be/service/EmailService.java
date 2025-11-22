package com.capstone.be.service;

import java.util.UUID;

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
}
