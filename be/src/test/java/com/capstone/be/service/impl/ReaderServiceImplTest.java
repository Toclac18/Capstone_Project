package com.capstone.be.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.capstone.be.domain.entity.Reader;
import com.capstone.be.dto.request.auth.ReaderRegisterRequest;
import com.capstone.be.dto.response.auth.ReaderRegisterResponse;
import com.capstone.be.mapper.ReaderMapper;
import com.capstone.be.repository.ReaderRepository;
import com.capstone.be.security.service.JwtService;
import com.capstone.be.service.EmailService;
import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class ReaderServiceImplTest {

  private static final String EMAIL = "user@example.com";
  private static final String USERNAME = "user";
  private static final String RAW_PASSWORD = "secret123";
  private static final LocalDate DATE_OF_BIRTH = LocalDate.of(2000, 1, 1);
  private static final String FULL_NAME = "User Name";

  @Mock
  private ReaderRepository readerRepository;
  @Mock
  private PasswordEncoder passwordEncoder;
  @Mock
  private JwtService jwtService;
  @Mock
  private EmailService emailService;
  @Mock
  private ReaderMapper readerMapper;

  @InjectMocks
  private ReaderServiceImpl readerService;

  private ReaderRegisterRequest buildRequest() {
    return ReaderRegisterRequest.builder()
        .fullName(FULL_NAME)
        .dateOfBirth(DATE_OF_BIRTH)
        .email(EMAIL)
        .username(USERNAME)
        .password(RAW_PASSWORD)
        .build();
  }

  @BeforeEach
  void setUp() {
    Mockito.lenient().when(passwordEncoder.encode(RAW_PASSWORD)).thenReturn("encoded-password");
  }

  @Test
  void register_createsReader_withEncodedPasswordAndSendsVerification() {
    ReaderRegisterRequest request = buildRequest();

    when(readerRepository.existsByEmail(EMAIL)).thenReturn(false);
    when(readerRepository.existsByUsername(USERNAME)).thenReturn(false);

    Reader mappedReader = new Reader();
    mappedReader.setEmail(EMAIL);
    mappedReader.setUsername(USERNAME);
    mappedReader.setPasswordHash("initial");
    when(readerMapper.toReader(request)).thenReturn(mappedReader);

    Reader savedReader = new Reader();
    savedReader.setId(UUID.randomUUID());
    savedReader.setEmail(EMAIL);
    savedReader.setUsername(USERNAME);
    savedReader.setPasswordHash("encoded-password");
    when(readerRepository.save(any(Reader.class))).thenReturn(savedReader);

    String verifyToken = "verify-token";
    when(jwtService.generateEmailVerifyToken(EMAIL)).thenReturn(verifyToken);

    ReaderRegisterResponse expectedResponse = ReaderRegisterResponse.builder()
        .email(EMAIL)
        .username(USERNAME)
        .build();
    when(readerMapper.toRegisterResponse(savedReader)).thenReturn(expectedResponse);

    ReaderRegisterResponse response = readerService.register(request);

    assertEquals(expectedResponse, response);

    ArgumentCaptor<Reader> readerCaptor = ArgumentCaptor.forClass(Reader.class);
    verify(readerRepository).save(readerCaptor.capture());
    Reader persisted = readerCaptor.getValue();
    assertEquals("encoded-password", persisted.getPasswordHash());

    verify(jwtService).generateEmailVerifyToken(EMAIL);
    verify(emailService).sendReaderVerificationEmail(savedReader, verifyToken);
  }

  @Test
  void register_throwsWhenEmailExists() {
    ReaderRegisterRequest request = buildRequest();
    when(readerRepository.existsByEmail(EMAIL)).thenReturn(true);

    IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
        () -> readerService.register(request));

    assertEquals("Email has been used", ex.getMessage());
    verify(readerRepository, never()).existsByUsername(anyString());
    verify(readerRepository, never()).save(any(Reader.class));
    verify(emailService, never()).sendReaderVerificationEmail(any(), anyString());
  }

  @Test
  void register_throwsWhenUsernameExists() {
    ReaderRegisterRequest request = buildRequest();
    when(readerRepository.existsByEmail(EMAIL)).thenReturn(false);
    when(readerRepository.existsByUsername(USERNAME)).thenReturn(true);

    IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
        () -> readerService.register(request));

    assertEquals("Username has been used", ex.getMessage());
    verify(readerRepository, never()).save(any(Reader.class));
    verify(emailService, never()).sendReaderVerificationEmail(any(), anyString());
  }
}
