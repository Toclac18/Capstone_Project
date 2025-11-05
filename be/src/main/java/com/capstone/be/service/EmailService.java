package com.capstone.be.service;

import com.capstone.be.domain.enums.UserRole;

public interface EmailService {

  void sendVerificationEmail(UserRole role, String toEmail, String toName);
}

