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
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailServiceImpl implements EmailService {

  private final JavaMailSender mailSender;

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
    return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .button { display: inline-block; padding: 12px 30px; background-color: #4CAF50;
                         color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Email Verification</h1>
                </div>
                <div class="content">
                    <h2>Welcome to Capstone Platform!</h2>
                    <p>Hello,</p>
                    <p>Thank you for registering with email: <strong>%s</strong></p>
                    <p>Please click the button below to verify your email address and activate your account:</p>
                    <p style="text-align: center;">
                        <a href="%s" class="button" style="color: #f8f8f9ff;">Verify Email</a>
                    </p>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #4CAF50;">%s</p>
                    <p><strong>This link will expire in 10 minutes.</strong></p>
                    <p>If you didn't create an account, please ignore this email.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 Capstone Platform. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """.formatted(email, verificationUrl, verificationUrl);
  }

  private String buildWelcomeEmailHtml(String fullName) {
    return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to Capstone Platform!</h1>
                </div>
                <div class="content">
                    <h2>Hello %s,</h2>
                    <p>Your email has been successfully verified!</p>
                    <p>You can now access all features of the Capstone Platform.</p>
                    <p>Start exploring documents, connect with reviewers, and much more!</p>
                    <p>If you have any questions, feel free to contact our support team.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 Capstone Platform. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """.formatted(fullName);
  }

  private String buildRejectionEmailHtml(String fullName, String rejectionReason) {
    return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #f44336; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .reason-box { background-color: #fff3cd; border-left: 4px solid #ffc107;
                             padding: 15px; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Reviewer Application Update</h1>
                </div>
                <div class="content">
                    <h2>Dear %s,</h2>
                    <p>Thank you for your interest in becoming a reviewer on the Capstone Platform.</p>
                    <p>After careful review of your application, we regret to inform you that we are unable
                       to approve your reviewer registration at this time.</p>
                    <div class="reason-box">
                        <strong>Reason:</strong>
                        <p>%s</p>
                    </div>
                    <p>We appreciate your interest in contributing to our platform. If you believe this decision
                       was made in error or if you would like to reapply in the future, please feel free to
                       contact our support team.</p>
                    <p>Thank you for your understanding.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 Capstone Platform. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """.formatted(fullName, rejectionReason);
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
    return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #f44336; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .reason-box { background-color: #fff3cd; border-left: 4px solid #ffc107;
                             padding: 15px; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Organization Registration Update</h1>
                </div>
                <div class="content">
                    <h2>Dear %s,</h2>
                    <p>Thank you for registering your organization on the Capstone Platform.</p>
                    <p>After careful review of your registration, we regret to inform you that we are unable
                       to approve your organization at this time.</p>
                    <div class="reason-box">
                        <strong>Reason:</strong>
                        <p>%s</p>
                    </div>
                    <p>If you believe this decision was made in error or if you have additional documentation
                       to support your registration, please feel free to contact our support team.</p>
                    <p>Thank you for your understanding.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 Capstone Platform. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """.formatted(fullName, rejectionReason);
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
    return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .otp-box { background-color: #e3f2fd; border: 2px solid #2196F3;
                          padding: 20px; margin: 20px 0; text-align: center;
                          border-radius: 8px; }
                .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 8px;
                           color: #2196F3; font-family: monospace; }
                .warning { background-color: #fff3cd; border-left: 4px solid #ffc107;
                          padding: 15px; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Email Change Verification</h1>
                </div>
                <div class="content">
                    <h2>Verify Your Email Change Request</h2>
                    <p>You have requested to change your email address to:</p>
                    <p style="text-align: center; font-size: 18px;"><strong>%s</strong></p>
                    <p>Please use the following OTP code to verify this change:</p>
                    <div class="otp-box">
                        <p style="margin: 0; color: #666;">Your OTP Code</p>
                        <p class="otp-code">%s</p>
                    </div>
                    <div class="warning">
                        <p style="margin: 0;"><strong>⏰ This OTP will expire in 10 minutes.</strong></p>
                    </div>
                    <p><strong>Important:</strong> After verifying this OTP, your email will be changed and you will need to log in again with your new email address.</p>
                    <p>If you did not request this email change, please ignore this email and secure your account immediately.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 Capstone Platform. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """.formatted(newEmail, otp);
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
    return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .otp-box { background-color: #fff3e0; border: 2px solid #FF9800;
                          padding: 20px; margin: 20px 0; text-align: center;
                          border-radius: 8px; }
                .otp-code { font-size: 32px; font-weight: bold; letter-spacing: 8px;
                           color: #FF9800; font-family: monospace; }
                .warning { background-color: #ffebee; border-left: 4px solid #f44336;
                          padding: 15px; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Password Reset Request</h1>
                </div>
                <div class="content">
                    <h2>Hello %s,</h2>
                    <p>We received a request to reset your password for your Capstone Platform account.</p>
                    <p>Please use the following OTP code to reset your password:</p>
                    <div class="otp-box">
                        <p style="margin: 0; color: #666;">Your OTP Code</p>
                        <p class="otp-code">%s</p>
                    </div>
                    <div class="warning">
                        <p style="margin: 0;"><strong>⏰ This OTP will expire in 10 minutes.</strong></p>
                        <p style="margin: 10px 0 0 0;"><strong>Maximum 5 attempts allowed.</strong></p>
                    </div>
                    <p><strong>Security Notice:</strong> If you did not request a password reset, please ignore this email and ensure your account is secure. Consider changing your password if you suspect unauthorized access.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 Capstone Platform. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """.formatted(fullName, otp);
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
    return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .success-box { background-color: #e8f5e9; border-left: 4px solid #4CAF50;
                              padding: 15px; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Password Reset Successful</h1>
                </div>
                <div class="content">
                    <h2>Hello %s,</h2>
                    <div class="success-box">
                        <p style="margin: 0;"><strong>✓ Your password has been successfully reset.</strong></p>
                    </div>
                    <p>You can now log in to your Capstone Platform account using your new password.</p>
                    <p><strong>Security Tips:</strong></p>
                    <ul>
                        <li>Keep your password secure and don't share it with anyone</li>
                        <li>Use a unique password that you don't use on other websites</li>
                        <li>Consider using a password manager for better security</li>
                    </ul>
                    <p>If you did not perform this password reset, please contact our support team immediately as your account may be compromised.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 Capstone Platform. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """.formatted(fullName);
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

    return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #673AB7; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .invitation-box { background-color: #ede7f6; border-left: 4px solid #673AB7;
                                 padding: 15px; margin: 20px 0; }
                .button { display: inline-block; padding: 12px 30px; background-color: #673AB7;
                         color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Organization Invitation</h1>
                </div>
                <div class="content">
                    <h2>Hello %s,</h2>
                    <p>You have been invited to join an organization on the Capstone Platform!</p>
                    <div class="invitation-box">
                        <p style="margin: 0;"><strong>Organization:</strong> %s</p>
                    </div>
                    <p>By accepting this invitation, you will become a member of <strong>%s</strong> and gain access to exclusive resources and collaboration opportunities.</p>
                    <p style="text-align: center;">
                        <a href="%s" class="button" style="color: #f8f8f9ff;">Accept Invitation</a>
                    </p>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #673AB7;">%s</p>
                    <p><strong>Note:</strong> If you did not expect this invitation, you can safely ignore this email.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 Capstone Platform. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """.formatted(fullName, organizationName, organizationName, acceptanceUrl, acceptanceUrl);
  }

  private String buildOrganizationInvitationWithTokenHtml(String fullName, String organizationName,
      String invitationToken) {
    String acceptanceUrl = String.format(
        "%s?token=%s",
        joinOrganizationBaseUrl, invitationToken);

    return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #673AB7; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .invitation-box { background-color: #ede7f6; border-left: 4px solid #673AB7;
                                 padding: 15px; margin: 20px 0; }
                .button { display: inline-block; padding: 12px 30px; background-color: #673AB7;
                         color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
                .warning-box { background-color: #fff3cd; border-left: 4px solid #ff9800;
                              padding: 15px; margin: 20px 0; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Organization Invitation</h1>
                </div>
                <div class="content">
                    <h2>Hello %s,</h2>
                    <p>You have been invited to join an organization on the Capstone Platform!</p>
                    <div class="invitation-box">
                        <p style="margin: 0;"><strong>Organization:</strong> %s</p>
                    </div>
                    <p>By accepting this invitation, you will become a member of <strong>%s</strong> and gain access to exclusive resources and collaboration opportunities.</p>
                    <p style="text-align: center;">
                        <a href="%s" class="button" style="color: #f8f8f9ff;">Accept Invitation</a>
                    </p>
                    <div class="warning-box">
                        <p style="margin: 0;"><strong>Important:</strong> This invitation link will expire in 7 days for security reasons.</p>
                    </div>
                    <p><strong>Note:</strong> If you did not expect this invitation, you can safely ignore this email.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 Capstone Platform. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """.formatted(fullName, organizationName, organizationName, acceptanceUrl);
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
        ? """
            <div class="admin-notes">
                <h3>Admin Response:</h3>
                <p>%s</p>
            </div>
            """.formatted(adminNotes)
        : "";

    return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #673AB7; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .ticket-info { background-color: #e3f2fd; border-left: 4px solid #2196F3;
                              padding: 15px; margin: 20px 0; }
                .status-box { background-color: %s; color: white; padding: 10px;
                             text-align: center; border-radius: 5px; margin: 15px 0; }
                .admin-notes { background-color: #fff3cd; border-left: 4px solid #ffc107;
                              padding: 15px; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Support Ticket Update</h1>
                </div>
                <div class="content">
                    <h2>Hello %s,</h2>
                    <p>Your support ticket has been updated!</p>
                    <div class="ticket-info">
                        <p style="margin: 5px 0;"><strong>Ticket Code:</strong> %s</p>
                    </div>
                    <div class="status-box">
                        <strong>New Status: %s</strong>
                    </div>
                    %s
                    <p>You can view your ticket details anytime using your ticket code.</p>
                    <p>If you have any questions, please don't hesitate to reach out to us.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 Capstone Platform. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """.formatted(statusColor, fullName, ticketCode, status, adminNotesSection);
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

    return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #673AB7; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .invitation-box { background-color: #ede7f6; border-left: 4px solid #673AB7;
                                 padding: 15px; margin: 20px 0; }
                .button { display: inline-block; padding: 12px 30px; background-color: #673AB7;
                         color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                .info-box { background-color: #e3f2fd; border-left: 4px solid #2196F3;
                           padding: 15px; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>You're Invited!</h1>
                </div>
                <div class="content">
                    <h2>Hello,</h2>
                    <p>You have been invited to join <strong>%s</strong> on the Capstone Platform!</p>
                    <div class="invitation-box">
                        <p style="margin: 0;"><strong>Organization:</strong> %s</p>
                        <p style="margin: 10px 0 0 0;"><strong>Your Email:</strong> %s</p>
                    </div>
                    <p>To accept this invitation and join the organization, you need to create an account on the Capstone Platform first.</p>
                    <div class="info-box">
                        <p style="margin: 0;"><strong>Next Steps:</strong></p>
                        <ol style="margin: 10px 0 0 0; padding-left: 20px;">
                            <li>Create your account using the button below</li>
                            <li>Verify your email address</li>
                            <li>Log in and accept the organization invitation</li>
                        </ol>
                    </div>
                    <p style="text-align: center;">
                        <a href="%s" class="button" style="color: #f8f8f9ff;">Create Account</a>
                    </p>
                    <p>Or copy and paste this link into your browser:</p>
                    <p style="word-break: break-all; color: #673AB7;">%s</p>
                    <p><strong>Note:</strong> Please use the email address <strong>%s</strong> when registering to receive your organization invitation.</p>
                    <p>If you did not expect this invitation, you can safely ignore this email.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 Capstone Platform. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """.formatted(organizationName, organizationName, email, registerUrl, registerUrl, email);
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
        ? """
            <div class="reason-box">
                <h3>Admin Note:</h3>
                <p>%s</p>
            </div>
            """.formatted(reason)
        : "";

    return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .status-box { background-color: #e8f5e9; border-left: 4px solid #4CAF50;
                              padding: 15px; margin: 20px 0; }
                .reason-box { background-color: #fff3cd; border-left: 4px solid #ffc107;
                              padding: 15px; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Account Status Update</h1>
                </div>
                <div class="content">
                    <h2>Hello %s,</h2>
                    <p>Your account status on the Capstone Platform has been updated by an administrator.</p>
                    <div class="status-box">
                        <p style="margin: 0;"><strong>New Status:</strong> %s</p>
                    </div>
                    %s
                    <p>If you have any questions about this change, please contact our support team.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 Capstone Platform. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """.formatted(displayName, statusLabel, reasonSection);
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
        ? """
            <div class="reason-box">
                <h3>Admin Note:</h3>
                <p>%s</p>
            </div>
            """.formatted(reason)
        : "";

    return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .status-box { background-color: #e3f2fd; border-left: 4px solid #2196F3;
                              padding: 15px; margin: 20px 0; }
                .reason-box { background-color: #fff3cd; border-left: 4px solid #ffc107;
                              padding: 15px; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Organization Account Status Update</h1>
                </div>
                <div class="content">
                    <h2>Hello %s,</h2>
                    <p>The status of your organization admin account on the Capstone Platform has been updated.</p>
                    <div class="status-box">
                        <p style="margin: 0;"><strong>New Status:</strong> %s</p>
                    </div>
                    %s
                    <p>If you have any questions about this change, please contact our support team.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 Capstone Platform. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """.formatted(displayName, statusLabel, reasonSection);
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
      detailsSection = String.format("""
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #FFF8E1; border-radius: 8px; border-left: 4px solid #FFC107;">
                <tr>
                  <td style="padding: 16px;">
                    <p style="margin: 0 0 6px 0; font-size: 13px; font-weight: 600; color: #F57C00;">📝 Details</p>
                    <p style="margin: 0; font-size: 14px; color: #5D4037; line-height: 1.5;">%s</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          """, reason);
    }

    // Build points reward section for approved documents
    String pointsSection = "";
    if (newStatus == DocStatus.ACTIVE && !pointsText.isEmpty()) {
      pointsSection = """
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #E8F5E9; border-radius: 8px;">
                <tr>
                  <td style="padding: 16px; text-align: center;">
                    <p style="margin: 0; font-size: 28px;">🎉</p>
                    <p style="margin: 8px 0 0 0; font-size: 14px; font-weight: 600; color: #2E7D32;">Points Earned!</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          """;
    }

    return String.format("""
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
          <table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background-color: %s; padding: 40px 30px; text-align: center;">
                      <p style="margin: 0 0 12px 0; font-size: 48px;">%s</p>
                      <h1 style="margin: 0; color: #ffffff; font-size: 22px; font-weight: 600;">Document %s</h1>
                    </td>
                  </tr>
                  
                  <!-- Body -->
                  <tr>
                    <td style="padding: 30px 30px 20px 30px;">
                      <p style="margin: 0 0 16px 0; font-size: 16px; color: #333333;">Hello <strong>%s</strong>,</p>
                      <p style="margin: 0; font-size: 15px; color: #666666; line-height: 1.6;">%s</p>
                    </td>
                  </tr>
                  
                  <!-- Document Card -->
                  <tr>
                    <td style="padding: 0 30px 20px 30px;">
                      <table width="100%%" cellpadding="0" cellspacing="0" style="background-color: #F5F5F5; border-radius: 8px;">
                        <tr>
                          <td style="padding: 16px;">
                            <p style="margin: 0 0 6px 0; font-size: 11px; color: #999999; text-transform: uppercase; letter-spacing: 1px;">Document Title</p>
                            <p style="margin: 0; font-size: 15px; color: #333333; font-weight: 600;">📄 %s</p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                  
                  %s
                  %s
                  
                  <!-- CTA Button -->
                  <tr>
                    <td style="padding: 10px 30px 30px 30px; text-align: center;">
                      <a href="%s" style="display: inline-block; background-color: %s; color: #ffffff; padding: 14px 36px; border-radius: 6px; text-decoration: none; font-size: 14px; font-weight: 600;">Go to Readee</a>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #FAFAFA; padding: 20px 30px; text-align: center; border-top: 1px solid #EEEEEE;">
                      <p style="margin: 0 0 4px 0; font-size: 12px; color: #999999;">© 2025 Readee Platform. All rights reserved.</p>
                      <p style="margin: 0; font-size: 11px; color: #BBBBBB;">This is an automated message, please do not reply.</p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        """,
        headerColor,
        statusEmoji,
        statusLabel,
        displayName,
        mainMessage,
        safeTitle,
        detailsSection,
        pointsSection,
        frontendBaseUrl,
        headerColor
    );
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
        ? """
            <div class="reason-box">
                <h3>Admin Note:</h3>
                <p>%s</p>
            </div>
            """.formatted(reason)
        : "";

    return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: #9C27B0; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .role-box { background-color: #f3e5f5; border-left: 4px solid #9C27B0;
                              padding: 15px; margin: 20px 0; }
                .role-change { display: flex; align-items: center; justify-content: space-between; margin: 10px 0; }
                .role-old { color: #666; text-decoration: line-through; }
                .role-new { color: #9C27B0; font-weight: bold; }
                .arrow { margin: 0 15px; color: #9C27B0; font-size: 20px; }
                .reason-box { background-color: #fff3cd; border-left: 4px solid #ffc107;
                              padding: 15px; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Account Role Changed</h1>
                </div>
                <div class="content">
                    <h2>Hello %s,</h2>
                    <p>Your account role on the Capstone Platform has been changed by a System Administrator.</p>
                    <div class="role-box">
                        <div class="role-change">
                            <span class="role-old">%s</span>
                            <span class="arrow">→</span>
                            <span class="role-new">%s</span>
                        </div>
                    </div>
                    %s
                    <p>This change may affect your access permissions and available features. If you have any questions about this change, please contact our support team.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 Capstone Platform. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """.formatted(displayName, oldRoleLabel, newRoleLabel, reasonSection);
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
        ? """
            <div class="reason-box">
                <h3>Admin Note:</h3>
                <p>%s</p>
            </div>
            """.formatted(reason)
        : "";

    return """
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background-color: %s; color: white; padding: 20px; text-align: center; }
                .content { padding: 20px; background-color: #f9f9f9; }
                .status-box { background-color: #e3f2fd; border-left: 4px solid %s;
                              padding: 15px; margin: 20px 0; }
                .reason-box { background-color: #fff3cd; border-left: 4px solid #ffc107;
                              padding: 15px; margin: 20px 0; }
                .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Organization Status Update</h1>
                </div>
                <div class="content">
                    <h2>Hello %s,</h2>
                    <p>The status of <strong>%s</strong> on the Capstone Platform has been updated.</p>
                    <div class="status-box">
                        <p style="margin: 0;"><strong>New Status:</strong> %s</p>
                    </div>
                    <p>%s</p>
                    %s
                    <p>If you have any questions about this change, please contact your organization admin or our support team.</p>
                </div>
                <div class="footer">
                    <p>&copy; 2025 Capstone Platform. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """.formatted(headerColor, headerColor, displayName, orgName, statusLabel, statusMessage, reasonSection);
  }
}

