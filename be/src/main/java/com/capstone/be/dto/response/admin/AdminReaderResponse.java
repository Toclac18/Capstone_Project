package com.capstone.be.dto.response.admin;

import com.capstone.be.domain.enums.UserStatus;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminReaderResponse {

  private UUID userId;
  private String email;
  private String fullName;
  private String avatarUrl;
  private Integer point;
  private UserStatus status;
  private LocalDate dob;
  private Instant createdAt;
  private Instant updatedAt;
}
