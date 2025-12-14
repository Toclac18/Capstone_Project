package com.capstone.be.dto.response.tag;

import com.capstone.be.domain.enums.TagStatus;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for Tag information
 * Used for admin tag management
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TagResponse {

  private UUID id;

  private Long code;

  private String name;

  private TagStatus status;

  private Instant createdAt;

  private Instant updatedAt;
}
