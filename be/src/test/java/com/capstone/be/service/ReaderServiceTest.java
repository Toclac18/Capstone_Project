package com.capstone.be.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.capstone.be.domain.entity.ReaderProfile;
import com.capstone.be.domain.entity.User;
import com.capstone.be.dto.request.reader.UpdateReaderProfileRequest;
import com.capstone.be.dto.response.reader.ReaderProfileResponse;
import com.capstone.be.exception.ResourceNotFoundException;
import com.capstone.be.repository.ReaderProfileRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.service.impl.ReaderServiceImpl;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
@DisplayName("ReaderService Unit Tests")
class ReaderServiceTest {

  @Mock
  private UserRepository userRepository;

  @Mock
  private ReaderProfileRepository readerProfileRepository;

  @Mock
  private FileStorageService fileStorageService;

  @InjectMocks
  private ReaderServiceImpl readerService;

  private User user;
  private ReaderProfile readerProfile;
  private UUID userId;

  @BeforeEach
  void setUp() {
    userId = UUID.randomUUID();

    user = User.builder()
        .id(userId)
        .email("reader@example.com")
        .fullName("Test Reader")
        .build();

    readerProfile = ReaderProfile.builder()
        .id(UUID.randomUUID())
        .user(user)
        .point(0)
        .dob(LocalDate.of(1990, 1, 1))
        .build();
  }

  // test getProfile should return reader profile
  @Test
  @DisplayName("getProfile should return reader profile")
  void getProfile_ShouldReturnProfile() {
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(readerProfileRepository.findByUserId(userId)).thenReturn(Optional.of(readerProfile));

    ReaderProfileResponse result = readerService.getProfile(userId);

    assertNotNull(result);
    assertEquals(userId, result.getUserId());
    verify(readerProfileRepository, times(1)).findByUserId(userId);
  }

  // test getProfile should throw exception when user not found
  @Test
  @DisplayName("getProfile should throw exception when user not found")
  void getProfile_ShouldThrowException_WhenUserNotFound() {
    when(userRepository.findById(userId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> readerService.getProfile(userId));
    verify(readerProfileRepository, never()).findByUserId(any());
  }

  // test getProfile should throw exception when profile not found
  @Test
  @DisplayName("getProfile should throw exception when profile not found")
  void getProfile_ShouldThrowException_WhenProfileNotFound() {
    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(readerProfileRepository.findByUserId(userId)).thenReturn(Optional.empty());

    assertThrows(ResourceNotFoundException.class,
        () -> readerService.getProfile(userId));
  }

  // test updateProfile should update profile successfully
  @Test
  @DisplayName("updateProfile should update profile successfully")
  void updateProfile_ShouldUpdateProfile() {
    UpdateReaderProfileRequest request = UpdateReaderProfileRequest.builder()
        .fullName("Updated Name")
        .dob(LocalDate.of(1995, 5, 15))
        .build();

    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(readerProfileRepository.findByUserId(userId)).thenReturn(Optional.of(readerProfile));
    when(userRepository.save(any(User.class))).thenReturn(user);
    when(readerProfileRepository.save(any(ReaderProfile.class))).thenReturn(readerProfile);

    ReaderProfileResponse result = readerService.updateProfile(userId, request);

    assertNotNull(result);
    verify(userRepository, times(1)).save(any(User.class));
    verify(readerProfileRepository, times(1)).save(any(ReaderProfile.class));
  }

  // test updateProfile should update only provided fields
  @Test
  @DisplayName("updateProfile should update only provided fields")
  void updateProfile_ShouldUpdateOnlyProvidedFields() {
    UpdateReaderProfileRequest request = UpdateReaderProfileRequest.builder()
        .dob(LocalDate.of(1995, 5, 15))
        .build();

    when(userRepository.findById(userId)).thenReturn(Optional.of(user));
    when(readerProfileRepository.findByUserId(userId)).thenReturn(Optional.of(readerProfile));
    when(readerProfileRepository.save(any(ReaderProfile.class))).thenReturn(readerProfile);

    ReaderProfileResponse result = readerService.updateProfile(userId, request);

    assertNotNull(result);
    verify(userRepository, times(1)).save(any());
    verify(readerProfileRepository, times(1)).save(any(ReaderProfile.class));
  }
}

