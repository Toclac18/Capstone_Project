package com.capstone.be.service;

import com.capstone.be.domain.enums.UserRole;
import java.time.OffsetDateTime;

public interface EmailService {

  void sendVerificationEmail(UserRole role, String toEmail, String toName);

  boolean sendInvitationEmail(String email, String username, String verifyUrl,
      OffsetDateTime expiresAt);
}

