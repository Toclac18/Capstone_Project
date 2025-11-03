package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.Reader;
import com.capstone.be.domain.enums.ReaderStatus;
import com.capstone.be.dto.request.auth.ReaderRegisterRequest;
import com.capstone.be.dto.request.orgAdmin.ChangeAccessRequest;
import com.capstone.be.dto.response.auth.ReaderRegisterResponse;
import com.capstone.be.dto.response.orgAdmin.ReaderResponse;
import com.capstone.be.mapper.ReaderMapper;
import com.capstone.be.repository.ReaderRepository;
import com.capstone.be.security.service.JwtService;
import com.capstone.be.service.EmailService;
import com.capstone.be.service.ReaderService;
import com.capstone.be.util.ExceptionBuilder;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

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
  public ReaderRegisterResponse register(ReaderRegisterRequest request) {
    if (readerRepository.existsByEmail(request.getEmail())) {
      throw new IllegalArgumentException("Email has been used");
    }
    if (readerRepository.existsByUsername(request.getUsername())) {
      throw new IllegalArgumentException("Username has been used");
    }

    Reader reader = readerMapper.toReader(request);
    reader.setPasswordHash(passwordEncoder.encode(request.getPassword()));
    reader.setStatus(ReaderStatus.PENDING_VERIFICATION);
    reader.setCoinBalance(0);

    Reader savedReader = readerRepository.save(reader);

    String verificationToken = jwtService.generateEmailVerifyToken(savedReader.getEmail());
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
      readerRepository.save(reader);
    }
  }

  @Override
  public Page<ReaderResponse> getReaders(Integer page, Integer pageSize, String q, String status) {
    int pageIndex = (page == null || page < 1) ? 0 : page - 1;
    int size = (pageSize == null || pageSize < 1) ? 10 : pageSize;

    PageRequest pageable = PageRequest.of(pageIndex, size);

    Page<Reader> resultPage;

    if (q != null && !q.trim().isEmpty()) {
      resultPage = readerRepository
              .findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrUsernameContainingIgnoreCase(
                      q, q, q, pageable);
    } else if (status != null && !status.equalsIgnoreCase("ALL")) {
      ReaderStatus st = ReaderStatus.valueOf(status.toUpperCase());
      resultPage = readerRepository.findByStatus(st, pageable);
    } else {
      resultPage = readerRepository.findAll(pageable);
    }

    return resultPage.map(r -> ReaderResponse.builder()
            .id(r.getId())
            .fullName(r.getFullName())
            .username(r.getUsername())
            .dateOfBirth(r.getDateOfBirth())
            .email(r.getEmail())
            .avatarUrl(r.getAvatarUrl())
            .coinBalance(r.getCoinBalance())
            .status(r.getStatus())
            .build());
  }

  @Override
  public ReaderResponse changeAccess(ChangeAccessRequest req) {
    Reader reader = readerRepository.findById(req.getUserId())
            .orElseThrow(() -> ExceptionBuilder.notFound("Reader not found"));

    reader.setStatus(req.isEnable() ? ReaderStatus.ACTIVE : ReaderStatus.DEACTIVE);
    readerRepository.save(reader);

    return ReaderResponse.builder()
            .id(reader.getId())
            .fullName(reader.getFullName())
            .username(reader.getUsername())
            .dateOfBirth(reader.getDateOfBirth())
            .email(reader.getEmail())
            .avatarUrl(reader.getAvatarUrl())
            .coinBalance(reader.getCoinBalance())
            .status(reader.getStatus())
            .build();
  }
}
