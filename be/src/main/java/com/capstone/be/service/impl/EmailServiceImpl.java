package com.capstone.be.service.impl;

import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.security.service.JwtService;
import com.capstone.be.service.EmailService;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.util.UriComponentsBuilder;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

  private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
  private static final DateTimeFormatter VN_FMT =
          DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm (O)").withZone(VN_ZONE);
  private final JavaMailSender mailSender;
  private final JwtService jwtService;

  @Value("${app.mail.from}")
  private String fromAddress;

  @Value("${app.mail.verificationBaseUrl}")
  private String verificationBaseUrl;

  @Override
  @Async
  public void sendVerificationEmail(UserRole role, String toEmail, String toName) {
    Objects.requireNonNull(toEmail, "Email must not be null");
    Objects.requireNonNull(toName, "Email must not be null");

    String token = jwtService.generateEmailVerifyToken(role, toEmail);
    String verificationUrl = UriComponentsBuilder.fromHttpUrl(verificationBaseUrl)
        .queryParam("token", token)
        .build()
        .toUriString();

    SimpleMailMessage message = new SimpleMailMessage();
    message.setFrom(fromAddress);
    message.setTo(toEmail);
    message.setSubject("Verify your Capstone account email");
    message.setText(buildEmailBody(toName, verificationUrl));

    mailSender.send(message);
    log.info("Sent reader verification email to {}, token : {}\t\t", toEmail, token);
  }

  private String buildEmailBody(String username, String verificationUrl) {
    String greeting = StringUtils.hasText(username) ? "Hello " + username + "," : "Hello,";
    return greeting + "\n\n"
        + "Thank you for registering with Readee. Please verify your email address "
        + "by clicking the link below within 10 minutes:\n\n"
        + verificationUrl + "\n\n"
        + "If you did not make this request, please ignore this email.";
  }

  @Override
  public boolean sendInvitationEmail(
          String toEmail, String username, String verifyUrl, OffsetDateTime expiresAt) {
    try {
      if (!StringUtils.hasText(toEmail)) {
        throw new IllegalArgumentException("Recipient email must not be blank");
      }

      if (!StringUtils.hasText(verifyUrl)) {
        throw new IllegalArgumentException("verifyUrl must not be blank");
      }

      String expiresDisplay =
              (expiresAt == null ? "" : VN_FMT.format(expiresAt.atZoneSameInstant(VN_ZONE)));

      String body =
              buildInvitationBody(username, verifyUrl, expiresDisplay);

      SimpleMailMessage msg = new SimpleMailMessage();
      msg.setFrom(fromAddress);
      msg.setTo(toEmail);
      msg.setSubject("Organization Invitation");
      msg.setText(body);

      mailSender.send(msg);
      System.out.println("✅ Email sent to " + toEmail);
      return true;
    } catch (Exception e) {
      System.err.println("❌ Failed to send email: " + e.getMessage());
      return false;
    }
  }

  private String buildInvitationBody(String username, String verifyUrl, String expiresDisplay) {
    String greeting = StringUtils.hasText(username) ? "Hello " + username + "," : "Hello,";
    StringBuilder sb = new StringBuilder();
    sb.append(greeting)
            .append("\n\n")
            .append("You’ve been invited to join our organization.\n")
            .append("Please verify your invitation using the link below:\n\n")
            .append(verifyUrl)
            .append("\n\n")
            .append("If you cannot access link, please login and go to profile and click button `Join` ")
            .append("\n\n");
    if (StringUtils.hasText(expiresDisplay)) {
      sb.append("This link will expire at ").append(expiresDisplay).append(" (Asia/Ho_Chi_Minh).")
              .append("\n\n");
    }
    sb.append("If you didn’t request this, please ignore this email.");
    return sb.toString();
  }
}

