package com.capstone.be.dto.response.document;

import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for document violation
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentViolationResponse {

  private UUID id;
  private String type; // "text" or "image"
  private String snippet; // For text violations, the offending text
  private Integer page; // Page number where violation was found
  private String prediction; // e.g., "toxic"
  private Double confidence; // Confidence score (0.0 to 1.0)
  private Instant createdAt;
}
