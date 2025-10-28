package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.Reader;
import com.capstone.be.domain.enums.ReaderStatus;
import com.capstone.be.dto.request.auth.RegisterReaderRequest;
import com.capstone.be.dto.response.auth.RegisterReaderResponse;
import com.capstone.be.mapper.ReaderMapper;
import com.capstone.be.repository.ReaderRepository;
import com.capstone.be.security.service.JwtService;
import com.capstone.be.service.EmailService;
import com.capstone.be.service.ReaderService;
import com.capstone.be.util.ExceptionBuilder;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class ReaderServiceImpl implements ReaderService {

  private final ReaderRepository readerRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;
  private final EmailService emailService;
  private final ReaderMapper readerMapper;

  @Override
  @Transactional
  public RegisterReaderResponse register(RegisterReaderRequest request) {
    // Check email existed
    if (readerRepository.existsByEmail(request.getEmail())) {
      throw new IllegalArgumentException("Email has been used");
    }

    // Check username existed
    if (readerRepository.existsByUsername(request.getUsername())) {
      throw new IllegalArgumentException("Username has been used");
    }

    // Create Reader Entity From Dto
    Reader reader = readerMapper.toReader(request);
    reader.setPasswordHash(passwordEncoder.encode(request.getPassword()));

    // Save Reader to DB
    Reader savedReader = readerRepository.save(reader);

    String verificationToken = jwtService.generateEmailVerifyToken(savedReader.getEmail());
    System.out.println("Verify Token for " + savedReader.getEmail() + " : " + verificationToken);

    emailService.sendReaderVerificationEmail(savedReader, verificationToken);

    return readerMapper.toRegisterResponse(savedReader);
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
