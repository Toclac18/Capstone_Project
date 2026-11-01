package com.capstone.be.scheduler;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.capstone.be.repository.PasswordResetTokenRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class PasswordResetTokenCleanupSchedulerTest {

  @Mock private PasswordResetTokenRepository repository;

  @InjectMocks private PasswordResetTokenCleanupScheduler scheduler;

  private void withRetentionDays(int days) {
    ReflectionTestUtils.setField(scheduler, "retentionDays", days);
  }

  @Test
  @DisplayName("Xoá theo mốc = bây giờ trừ số ngày giữ lại")
  void deletesUsingRetentionCutoff() {
    withRetentionDays(7);
    when(repository.deleteExpiredTokens(any())).thenReturn(3);

    Instant before = Instant.now().minus(7, ChronoUnit.DAYS);
    scheduler.cleanupExpiredTokens();
    Instant after = Instant.now().minus(7, ChronoUnit.DAYS);

    ArgumentCaptor<Instant> cutoff = ArgumentCaptor.forClass(Instant.class);
    verify(repository).deleteExpiredTokens(cutoff.capture());
    assertThat(cutoff.getValue()).isBetween(before, after);
  }

  @Test
  @DisplayName("Không có gì để xoá thì vẫn chạy bình thường")
  void handlesNothingToDelete() {
    withRetentionDays(7);
    when(repository.deleteExpiredTokens(any())).thenReturn(0);

    assertThatCode(() -> scheduler.cleanupExpiredTokens()).doesNotThrowAnyException();
  }

  @Test
  @DisplayName("Lỗi DB không làm chết scheduler")
  void databaseFailureDoesNotKillTheScheduler() {
    // Spring dừng lịch chạy nếu phương thức ném ra ngoài, nên job dọn phải nuốt lỗi.
    withRetentionDays(7);
    when(repository.deleteExpiredTokens(any()))
        .thenThrow(new RuntimeException("connection reset"));

    assertThatCode(() -> scheduler.cleanupExpiredTokens()).doesNotThrowAnyException();
  }

  @Test
  @DisplayName("retentionDays = 0 thì xoá mọi token đã hết hạn")
  void zeroRetentionDeletesEverythingExpired() {
    withRetentionDays(0);
    when(repository.deleteExpiredTokens(any())).thenReturn(10);

    scheduler.cleanupExpiredTokens();

    ArgumentCaptor<Instant> cutoff = ArgumentCaptor.forClass(Instant.class);
    verify(repository).deleteExpiredTokens(cutoff.capture());
    // Mốc là "bây giờ", nên mọi token có expiryTime < bây giờ đều bị xoá.
    assertThat(cutoff.getValue()).isBeforeOrEqualTo(Instant.now());
  }
}
