package com.capstone.be.dto.response.user;

import com.capstone.be.domain.enums.NotificationType;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for notification (matches frontend interface)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class NotificationResponse {

  private UUID id;

  private NotificationType type;

  private String title;

  private String summary;

  private Instant timestamp;

  private Boolean isRead;
}
