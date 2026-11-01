package com.capstone.be.scheduler;

import com.capstone.be.repository.PasswordResetTokenRepository;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Dọn token đặt lại mật khẩu đã hết hạn.
 *
 * <p>{@code PasswordResetTokenRepository.deleteExpiredTokens} đã có sẵn từ trước nhưng
 * KHÔNG có ai gọi, nên bảng {@code password_reset_tokens} chỉ lớn lên: mỗi lần xác thực
 * OTP thành công là thêm một dòng, không có gì xoá đi.
 *
 * <p>Token chỉ sống 10 phút. Giữ thêm một khoảng đệm ({@code retentionDays}, mặc định 7
 * ngày) để còn tra được lịch sử khi cần điều tra, rồi mới xoá.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class PasswordResetTokenCleanupScheduler {

  private final PasswordResetTokenRepository passwordResetTokenRepository;

  @Value("${app.auth.passwordResetToken.retentionDays:7}")
  private int retentionDays;

  /** Chạy hằng ngày 2:30 sáng — lệch 30 phút với hai job dọn khác để không chồng nhau. */
  @Scheduled(cron = "${app.auth.passwordResetToken.cleanupCron:0 30 2 * * ?}")
  @Transactional
  public void cleanupExpiredTokens() {
    Instant cutoff = Instant.now().minus(retentionDays, ChronoUnit.DAYS);
    log.info("Bắt đầu dọn password reset token hết hạn trước {}", cutoff);

    try {
      int deleted = passwordResetTokenRepository.deleteExpiredTokens(cutoff);
      if (deleted == 0) {
        log.info("Không có token hết hạn nào cần xoá");
      } else {
        log.info("Đã xoá {} password reset token hết hạn (mốc: {})", deleted, cutoff);
      }
    } catch (Exception e) {
      // Không ném lại: một lần dọn lỗi không được làm chết scheduler.
      log.error("Lỗi khi dọn password reset token hết hạn", e);
    }
  }
}
