package com.capstone.be.dto.response.user;

import java.time.LocalDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
  private UUID id;
  private String name;
  private String email;
  private String role;
  private String status;
  private LocalDateTime createdAt;
}
