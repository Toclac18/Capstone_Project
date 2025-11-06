package com.capstone.be.service;

import com.capstone.be.domain.entity.Reader;

import java.time.OffsetDateTime;

public interface EmailService {

    void sendReaderVerificationEmail(Reader reader, String token);

    boolean sendInvitationEmail(String email, String username, String verifyUrl, OffsetDateTime expiresAt);
}
