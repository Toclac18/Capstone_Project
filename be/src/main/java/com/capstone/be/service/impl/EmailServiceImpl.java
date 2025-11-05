package com.capstone.be.service.impl;

import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.security.service.JwtService;
import com.capstone.be.service.EmailService;
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
}

