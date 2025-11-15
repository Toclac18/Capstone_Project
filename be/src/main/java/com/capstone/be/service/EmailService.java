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
}
