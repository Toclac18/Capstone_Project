package com.capstone.be.event;

import com.capstone.be.domain.enums.UserStatus;
import java.util.UUID;

/**
 * Trạng thái một người dùng (reader hoặc reviewer) vừa đổi.
 *
 * <p>Mang sẵn giá trị, KHÔNG mang entity: listener chạy sau khi transaction đã commit,
 * lúc đó đọc quan hệ lazy của entity sẽ ném LazyInitializationException.
 */
public record UserStatusChangedEvent(
    UUID userId,
    String email,
    String fullName,
    UserStatus newStatus,
    String reason
) {}
