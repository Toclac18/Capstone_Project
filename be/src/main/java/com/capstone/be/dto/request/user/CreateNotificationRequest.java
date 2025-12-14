package com.capstone.be.dto.request.user;

import com.capstone.be.domain.enums.NotificationType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating a notification
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateNotificationRequest {

  @NotNull(message = "User ID is required")
  private UUID userId;

  @NotNull(message = "Notification type is required")
  private NotificationType type;

  @NotBlank(message = "Title is required")
  @Size(max = 200, message = "Title must not exceed 200 characters")
  private String title;

  @NotBlank(message = "Summary is required")
  @Size(max = 1000, message = "Summary must not exceed 1000 characters")
  private String summary;
}

