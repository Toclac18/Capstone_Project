package com.capstone.be.service.impl;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.capstone.be.domain.entity.Reader;
import com.capstone.be.dto.request.ReaderRegisterRequest;
import com.capstone.be.repository.ReaderRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

@ExtendWith(MockitoExtension.class)
class ReaderServiceImplTest {

  private static final String EMAIL = "user@example.com";
  private static final String USERNAME = "user";
  private static final String RAW_PASSWORD = "secret";

  @Mock
  private ReaderRepository readerRepository;

  @Mock
  private PasswordEncoder passwordEncoder;

  @InjectMocks
  private ReaderServiceImpl readerService;

  private ReaderRegisterRequest buildRequest() {
    return ReaderRegisterRequest.builder()
        .email(EMAIL)
        .username(USERNAME)
        .password(RAW_PASSWORD)
        .build();
  }

  @BeforeEach
  void setUp() {
    when(passwordEncoder.encode(RAW_PASSWORD)).thenReturn("encoded-password");
  }

  @Test
  void register_createsReader_withEncodedPassword() {
    ReaderRegisterRequest request = buildRequest();
    when(readerRepository.existsByEmail(EMAIL)).thenReturn(false);
    when(readerRepository.existsByUsername(USERNAME)).thenReturn(false);
    when(readerRepository.save(any(Reader.class))).thenAnswer(invocation -> {
      Reader toSave = invocation.getArgument(0);
      toSave.setId(1L);
      return toSave;
    });

    Reader savedReader = readerService.register(request);

    assertEquals(1L, savedReader.getId());
    assertEquals(USERNAME, savedReader.getUsername());
    assertEquals(EMAIL, savedReader.getEmail());
    assertEquals("encoded-password", savedReader.getPasswordHash());

    ArgumentCaptor<Reader> captor = ArgumentCaptor.forClass(Reader.class);
    verify(readerRepository).save(captor.capture());
    Reader persisted = captor.getValue();
    assertEquals("encoded-password", persisted.getPasswordHash());
    assertEquals(USERNAME, persisted.getUsername());
    assertEquals(EMAIL, persisted.getEmail());
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
  }
}
