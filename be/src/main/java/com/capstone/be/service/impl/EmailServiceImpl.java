package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.Reader;
import com.capstone.be.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.util.UriComponentsBuilder;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailServiceImpl implements EmailService {

    private static final ZoneId VN_ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final DateTimeFormatter VN_FMT =
            DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm (O)").withZone(VN_ZONE);
    private final JavaMailSender mailSender;
    @Value("${app.mail.from}")
    private String fromAddress;
    /**
     * Base URL for reader self-verification flow (different from invitation).
     */
    @Value("${app.mail.verificationBaseUrl}")
    private String verificationBaseUrl;
    /**
     * Base URL for organization invitation verify page (fallback to required URL).
     */
    @Value("${app.mail.invitationBaseUrl:http://localhost:3000/verify-org-invitation}")
    private String invitationBaseUrl;

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
        message.setText(buildReaderVerifyBody(reader.getUsername(), verificationUrl));

        mailSender.send(message);
        log.info("Sent reader verification email to {}", reader.getEmail());
    }

    private String buildReaderVerifyBody(String username, String verificationUrl) {
        String greeting = StringUtils.hasText(username) ? "Hello " + username + "," : "Hello,";
        return greeting
                + "\n\n"
                + "Thank you for registering with Capstone. Please verify your email address "
                + "by clicking the link below within 10 minutes:\n\n"
                + verificationUrl
                + "\n\n"
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
                .append("\n\n");
        if (StringUtils.hasText(expiresDisplay)) {
            sb.append("This link will expire at ").append(expiresDisplay).append(" (Asia/Ho_Chi_Minh).")
                    .append("\n\n");
        }
        sb.append("If you didn’t request this, please ignore this email.");
        return sb.toString();
    }
}
