package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.Reader;
import com.capstone.be.domain.enums.ReaderStatus;
import com.capstone.be.dto.request.auth.ReaderRegisterRequest;
import com.capstone.be.repository.ReaderRepository;
import com.capstone.be.security.service.JwtService;
import com.capstone.be.service.EmailService;
import com.capstone.be.service.ReaderService;
import com.capstone.be.util.ExceptionBuilder;
import io.jsonwebtoken.JwtException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
public class ReaderServiceImpl implements ReaderService {

  @Autowired
  private ReaderRepository readerRepository;

  @Autowired
  private PasswordEncoder passwordEncoder;

  @Autowired
  private JwtService jwtService;

  @Autowired
  private EmailService emailService;

  @Override
  @Transactional
  public Reader register(ReaderRegisterRequest request) {
    // Check email existed
    if (readerRepository.existsByEmail(request.getEmail())) {
      throw new IllegalArgumentException("Email has been used");
    }

    // Check username existed
    if (readerRepository.existsByUsername(request.getUsername())) {
      throw new IllegalArgumentException("Username has been used");
    }

    // Create Reader Entity From Dto
    Reader reader = new Reader();
    reader.setUsername(request.getUsername());
    reader.setEmail(request.getEmail());
    reader.setPasswordHash(passwordEncoder.encode(request.getPassword()));

    // Save Reader to DB
    Reader savedReader = readerRepository.save(reader);

    String verificationToken = jwtService.generateEmailVerifyToken(savedReader.getEmail());
    System.out.println("Verify Token for " + savedReader.getEmail() + " : " + verificationToken);

    emailService.sendReaderVerificationEmail(savedReader, verificationToken);

    return savedReader;
  }

  @Override
  @Transactional
  public void verifyEmail(String token) {
    if (!StringUtils.hasText(token)) {
      throw ExceptionBuilder.badRequest("Verify token is required");
    }

    String email;
    try {
      email = jwtService.extractEmailFromEmailVerifyToken(token);
    } catch (JwtException | IllegalArgumentException ex) {
      throw ExceptionBuilder.badRequest("Verify token is invalid or expired");
    }

    Reader reader = readerRepository.findByEmail(email)
        .orElseThrow(() -> ExceptionBuilder.notFound("Account not found"));

    if (ReaderStatus.PENDING_VERIFICATION.equals(reader.getStatus())) {
      reader.setStatus(ReaderStatus.ACTIVE);
    }
  }
}
