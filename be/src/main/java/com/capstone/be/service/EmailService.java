package com.capstone.be.service;

import com.capstone.be.domain.entity.Reader;
import com.capstone.be.domain.entity.Reviewer;

public interface EmailService {

  void sendReaderVerificationEmail(Reader reader, String token);

  void sendReviewerVerificationEmail(Reviewer reviewer, String token);
}

