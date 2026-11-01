package com.capstone.be.service.impl;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.capstone.be.domain.entity.PasswordResetToken;
import com.capstone.be.domain.entity.User;
import com.capstone.be.exception.BusinessException;
import com.capstone.be.exception.InvalidRequestException;
import com.capstone.be.repository.EmailChangeRequestRepository;
import com.capstone.be.repository.PasswordResetRequestRepository;
import com.capstone.be.repository.PasswordResetTokenRepository;
import com.capstone.be.repository.UserRepository;
import com.capstone.be.service.EmailService;
import com.capstone.be.service.FileStorageService;
import com.capstone.be.service.helper.NotificationHelper;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Hợp đồng của {@code resetPasswordWithToken}.
 *
 * <p>Chốt hành vi TRƯỚC khi đổi cách tra token, giống cách đã làm với golden test cho
 * email template: FE dựa vào đúng các thông điệp lỗi này
 * ({@code fe/src/app/auth/forgot-password}), nên đổi chúng là đổi hợp đồng.
 *
 */
@ExtendWith(MockitoExtension.class)
class PasswordResetTokenLookupTest {

  @Mock private UserRepository userRepository;
  @Mock private PasswordEncoder passwordEncoder;
  @Mock private EmailChangeRequestRepository emailChangeRequestRepository;
  @Mock private PasswordResetRequestRepository passwordResetRequestRepository;
  @Mock private PasswordResetTokenRepository passwordResetTokenRepository;
  @Mock private EmailService emailService;
  @Mock private FileStorageService fileStorageService;
  @Mock private NotificationHelper notificationHelper;

  @InjectMocks private UserAccountServiceImpl service;

  private static final String RAW_TOKEN = "raw-reset-token-48-bytes-base64url";
  private static final String NEW_PASSWORD = "NewPassw0rd!";

  private User user;

  @BeforeEach
  void setUp() {
    user = new User();
    user.setEmail("reader@example.com");
    user.setPasswordHash("$2a$10$hash-of-the-OLD-password");
  }

  private PasswordResetToken token(boolean used, Instant expiry) {
    return PasswordResetToken.builder()
        .user(user)
        .tokenHash("stored-hash")
        .expiryTime(expiry)
        .used(used)
        .build();
  }

  private PasswordResetToken validToken() {
    return token(false, Instant.now().plusSeconds(600));
  }

  /** Cho mọi cách tra: trả về token này cho RAW_TOKEN. */
  private void tokenInStore(PasswordResetToken stored) {
    lenient().when(passwordResetTokenRepository.findAll()).thenReturn(List.of(stored));
    lenient()
        .when(passwordResetTokenRepository.findValidTokenByHash(anyString(), any()))
        .thenReturn(stored.isValid() ? Optional.of(stored) : Optional.empty());
    lenient().when(passwordEncoder.matches(eq(RAW_TOKEN), eq("stored-hash"))).thenReturn(true);
  }

  private void emptyStore() {
    lenient().when(passwordResetTokenRepository.findAll()).thenReturn(List.of());
    lenient()
        .when(passwordResetTokenRepository.findValidTokenByHash(anyString(), any()))
        .thenReturn(Optional.empty());
  }

  @Test
  @DisplayName("Token hợp lệ: đổi mật khẩu và đánh dấu token đã dùng")
  void validTokenResetsPasswordAndConsumesToken() {
    PasswordResetToken stored = validToken();
    tokenInStore(stored);
    when(passwordEncoder.matches(eq(NEW_PASSWORD), eq(user.getPasswordHash()))).thenReturn(false);
    when(passwordEncoder.encode(NEW_PASSWORD)).thenReturn("$2a$10$hash-of-the-NEW-password");

    service.resetPasswordWithToken(RAW_TOKEN, NEW_PASSWORD);

    ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
    verify(userRepository).save(saved.capture());
    assertThat(saved.getValue().getPasswordHash()).isEqualTo("$2a$10$hash-of-the-NEW-password");

    // Token phải bị tiêu, nếu không nó dùng lại được
    assertThat(stored.getUsed()).isTrue();
    verify(passwordResetTokenRepository).save(stored);
  }

  @Test
  @DisplayName("Token không tồn tại: 'Invalid or expired reset token'")
  void unknownTokenIsRejected() {
    emptyStore();

    assertThatThrownBy(() -> service.resetPasswordWithToken("some-other-token", NEW_PASSWORD))
        .isInstanceOf(InvalidRequestException.class)
        .hasMessage("Invalid or expired reset token");
  }

  @Test
  @DisplayName("Token đã hết hạn: 'Invalid or expired reset token'")
  void expiredTokenIsRejected() {
    tokenInStore(token(false, Instant.now().minusSeconds(1)));

    assertThatThrownBy(() -> service.resetPasswordWithToken(RAW_TOKEN, NEW_PASSWORD))
        .isInstanceOf(InvalidRequestException.class)
        .hasMessage("Invalid or expired reset token");
  }

  @Test
  @DisplayName("Token đã dùng rồi thì không dùng lại được")
  void usedTokenIsRejected() {
    tokenInStore(token(true, Instant.now().plusSeconds(600)));

    // Đây là tình huống người dùng gặp khi bấm submit hai lần — xem
    // fe/.../ForgotPasswordContent.tsx, nút từng bật lại trong khoảng chờ điều hướng.
    assertThatThrownBy(() -> service.resetPasswordWithToken(RAW_TOKEN, NEW_PASSWORD))
        .isInstanceOf(InvalidRequestException.class);
  }

  @Test
  @DisplayName("Mật khẩu mới trùng mật khẩu cũ: SAME_PASSWORD, và token KHÔNG bị tiêu")
  void samePasswordIsRejectedWithoutConsumingToken() {
    PasswordResetToken stored = validToken();
    tokenInStore(stored);
    when(passwordEncoder.matches(eq(NEW_PASSWORD), eq(user.getPasswordHash()))).thenReturn(true);

    assertThatThrownBy(() -> service.resetPasswordWithToken(RAW_TOKEN, NEW_PASSWORD))
        .isInstanceOf(BusinessException.class)
        .hasMessageContaining("must be different");

    // Người dùng còn dùng lại được token để thử mật khẩu khác.
    assertThat(stored.getUsed()).isFalse();
  }

  @Test
  @DisplayName("Token của người khác không mở được tài khoản này")
  void tokenIsBoundToItsOwnUser() {
    User other = new User();
    other.setEmail("someone-else@example.com");
    other.setPasswordHash("$2a$10$other");
    PasswordResetToken stored =
        PasswordResetToken.builder()
            .user(other)
            .tokenHash("stored-hash")
            .expiryTime(Instant.now().plusSeconds(600))
            .used(false)
            .build();
    tokenInStore(stored);
    when(passwordEncoder.matches(eq(NEW_PASSWORD), eq("$2a$10$other"))).thenReturn(false);
    when(passwordEncoder.encode(NEW_PASSWORD)).thenReturn("$2a$10$new");

    assertThatCode(() -> service.resetPasswordWithToken(RAW_TOKEN, NEW_PASSWORD))
        .doesNotThrowAnyException();

    ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
    verify(userRepository).save(saved.capture());
    // Mật khẩu đổi cho CHỦ của token, không phải ai khác.
    assertThat(saved.getValue().getEmail()).isEqualTo("someone-else@example.com");
  }
}
