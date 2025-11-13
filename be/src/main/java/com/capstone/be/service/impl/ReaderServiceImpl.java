package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.OrganizationEnrollment;
import com.capstone.be.domain.entity.Reader;
import com.capstone.be.domain.enums.ReaderStatus;
import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.dto.request.auth.RegisterReaderRequest;
import com.capstone.be.dto.request.orgAdmin.ChangeAccessRequest;
import com.capstone.be.dto.response.auth.RegisterReaderResponse;
import com.capstone.be.dto.response.orgAdmin.ReaderResponse;
import com.capstone.be.dto.response.reader.JoinedOrganizationResponse;
import com.capstone.be.mapper.ReaderMapper;
import com.capstone.be.mapper.ReaderOrganizationMapper;
import com.capstone.be.repository.EnrollmentRepository;
import com.capstone.be.repository.ReaderRepository;
import com.capstone.be.security.service.JwtService;
import com.capstone.be.service.EmailService;
import com.capstone.be.service.ReaderService;
import com.capstone.be.util.ExceptionBuilder;
import io.jsonwebtoken.JwtException;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor

public class ReaderServiceImpl implements ReaderService {

  private final ReaderRepository readerRepository;
  private final EnrollmentRepository enrollmentRepository;
  private final PasswordEncoder passwordEncoder;
  private final JwtService jwtService;
  private final EmailService emailService;
  private final ReaderMapper readerMapper;
  private final ReaderOrganizationMapper readerOrganizationMapper;

  @Override
  @Transactional
  public RegisterReaderResponse register(RegisterReaderRequest request) {
    if (readerRepository.existsByEmail(request.getEmail())) {
      throw new IllegalArgumentException("Email has been used");
    }
    if (readerRepository.existsByUsername(request.getUsername())) {
      throw new IllegalArgumentException("Username has been used");
    }

    Reader reader = readerMapper.toReader(request);
    reader.setPasswordHash(passwordEncoder.encode(request.getPassword()));
    reader.setStatus(ReaderStatus.PENDING_EMAIL_VERIFICATION);
    reader.setPoint(0);

    Reader savedReader = readerRepository.save(reader);

//    String verificationToken = jwtService.generateEmailVerifyToken(savedReader.getEmail());
    emailService.sendVerificationEmail(UserRole.READER, savedReader.getEmail(),
        savedReader.getFullName());

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
      email = jwtService.extractEmailFromToken(token);
    } catch (JwtException | IllegalArgumentException ex) {
      throw ExceptionBuilder.badRequest("Verify token is invalid or expired");
    }

    Reader reader = readerRepository.findByEmail(email)
        .orElseThrow(() -> ExceptionBuilder.notFound("Account not found"));

    if (ReaderStatus.PENDING_EMAIL_VERIFICATION.equals(reader.getStatus())) {
      reader.setStatus(ReaderStatus.ACTIVE);
      readerRepository.save(reader);
    }
  }

  @Override
  public Page<ReaderResponse> getReaders(String q, ReaderStatus status, Pageable pageable) {
    Page<Reader> pageOfReader = readerRepository.search(q, status, pageable);

    return pageOfReader.map(r -> ReaderResponse.builder()
        .id(r.getId())
        .fullName(r.getFullName())
//        .username(r.getUsername())
//        .dateOfBirth(r.getDateOfBirth())
        .email(r.getEmail())
        .avatarUrl(r.getAvatarUrl())
//        .coinBalance(r.getPoint())
        .status(r.getStatus())
        .build());
  }

//  @Override
//  public Page<ReaderResponse> getReaders(Integer page, Integer pageSize, String q, String status) {
//    int pageIndex = (page == null || page < 1) ? 0 : page - 1;
//    int size = (pageSize == null || pageSize < 1) ? 10 : pageSize;
//
//    PageRequest pageable = PageRequest.of(pageIndex, size);
//
//    Page<Reader> resultPage;
//
//    if (q != null && !q.trim().isEmpty()) {
//      resultPage = readerRepository
//          .findByFullNameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrUsernameContainingIgnoreCase(
//              q, q, q, pageable);
//    } else if (status != null && !status.equalsIgnoreCase("ALL")) {
//      ReaderStatus st = ReaderStatus.valueOf(status.toUpperCase());
//      resultPage = readerRepository.findByStatus(st, pageable);
//    } else {
//      resultPage = readerRepository.findAll(pageable);
//    }
//
//    return resultPage.map(r -> ReaderResponse.builder()
//        .id(r.getId())
//        .fullName(r.getFullName())
//        .username(r.getUsername())
//        .dateOfBirth(r.getDateOfBirth())
//        .email(r.getEmail())
//        .avatarUrl(r.getAvatarUrl())
//        .coinBalance(r.getPoint())
//        .status(r.getStatus())
//        .build());
//  }

  @Override
  public ReaderResponse changeAccess(ChangeAccessRequest req) {
    Reader reader = readerRepository.findById(req.getUserId())
        .orElseThrow(() -> ExceptionBuilder.notFound("Reader not found"));

    reader.setStatus(req.isEnable() ? ReaderStatus.ACTIVE : ReaderStatus.DEACTIVE);
    readerRepository.save(reader);

    return ReaderResponse.builder()
        .id(reader.getId())
        .fullName(reader.getFullName())
//        .username(reader.getUsername())
//        .dateOfBirth(reader.getDateOfBirth())
        .email(reader.getEmail())
        .avatarUrl(reader.getAvatarUrl())
//        .coinBalance(reader.getPoint())
        .status(reader.getStatus())
        .build();
  }

  @Override
  @Transactional(readOnly = true)
  public Page<JoinedOrganizationResponse> getJoinedOrganizations(
      UUID readerId, Pageable pageable) {
    if (readerId == null) {
      throw ExceptionBuilder.badRequest("Reader ID is required");
    }
    if (pageable == null) {
      throw ExceptionBuilder.badRequest("Pagination info is required");
    }

    boolean readerExists = readerRepository.existsById(readerId);
    if (!readerExists) {
      throw ExceptionBuilder.notFound("Reader not found");
    }

    Page<OrganizationEnrollment> enrollments = enrollmentRepository.findJoinedOrganizationByReaderId(
        readerId,
        pageable);

    return enrollments.map(readerOrganizationMapper::toJoinedOrganizationResponse);
  }

}
