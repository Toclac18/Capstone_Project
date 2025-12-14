package com.capstone.be.dto.response.doctype;

import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for DocType details (for admin)
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocTypeDetailResponse {

  private UUID id;

  private Integer code;

  private String name;

  private String description;

  private Instant createdAt;

  private Instant updatedAt;
}
