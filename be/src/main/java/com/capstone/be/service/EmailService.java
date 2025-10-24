package com.capstone.be.service;

import com.capstone.be.domain.entity.Reader;

public interface EmailService {

  void sendReaderVerificationEmail(Reader reader, String token);
}

