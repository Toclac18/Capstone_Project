package com.capstone.be.service.impl;

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
                        <a href="%s" class="button">Verify Email</a>
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
}
