package com.capstone.be.service;

import com.capstone.be.domain.entity.Reader;

public interface EmailService {

  void sendReaderVerificationEmail(Reader reader, String token);

  boolean sendWelcomeEmail(String toEmail, String username, String temporaryPassword);
}
