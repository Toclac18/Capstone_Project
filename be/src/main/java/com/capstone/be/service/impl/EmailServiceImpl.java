package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.Reader;
import com.capstone.be.service.EmailService;
import java.util.Objects;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.util.UriComponentsBuilder;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

  private final JavaMailSender mailSender;

  @Value("${app.mail.from}")
  private String fromAddress;

  @Value("${app.mail.verificationBaseUrl}")
  private String verificationBaseUrl;

  @Override
  public void sendReaderVerificationEmail(Reader reader, String token) {
    Objects.requireNonNull(reader, "Reader must not be null");
    if (!StringUtils.hasText(token)) {
      throw new IllegalArgumentException("Verification token must not be blank");
    }

    String verificationUrl =
        UriComponentsBuilder.fromHttpUrl(verificationBaseUrl)
            .queryParam("token", token)
            .build()
            .toUriString();

    SimpleMailMessage message = new SimpleMailMessage();
    message.setFrom(fromAddress);
    message.setTo(reader.getEmail());
    message.setSubject("Verify your Capstone account email");
    message.setText(buildEmailBody(reader.getUsername(), verificationUrl));

    mailSender.send(message);
    log.info("Sent reader verification email to {}", reader.getEmail());
  }

  private String buildEmailBody(String username, String verificationUrl) {
    String greeting = StringUtils.hasText(username) ? "Hello " + username + "," : "Hello,";
    return greeting
        + "\n\n"
        + "Thank you for registering with Readee. Please verify your email address "
        + "by clicking the link below within 10 minutes:\n\n"
        + verificationUrl
        + "\n\n"
        + "If you did not make this request, please ignore this email.";
  }

  //  @Override
  //  public boolean sendWelcomeEmail(String toEmail, String username, String temporaryPassword) {
  //    // TODO: thay bằng JavaMailSender để gửi thật. Hiện tại mock để FE test.
  //    log.info("Mock send email to={} username={} tempPassword={}", toEmail, username,
  // temporaryPassword);
  //    return true;
  //  }

  @Override
  public boolean sendWelcomeEmail(String toEmail, String username, String temporaryPassword) {
    try {
      SimpleMailMessage msg = new SimpleMailMessage();
      msg.setTo(toEmail);
      msg.setSubject("[System] Welcome to our platform, " + username);
      msg.setText(
          "Hello "
              + username
              + ",\n\n"
              + "Your account has been successfully imported.\n"
              + "Temporary password: "
              + temporaryPassword
              + "\n\n"
              + "Please login and change your password.\n\n"
              + "Best regards,\nSupport Team");
      mailSender.send(msg);
      System.out.println("✅ Email sent to " + toEmail);
      return true;
    } catch (Exception e) {
      System.err.println("❌ Failed to send email: " + e.getMessage());
      return false;
    }
  }
}
