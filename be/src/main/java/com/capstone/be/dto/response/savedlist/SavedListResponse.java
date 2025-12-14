package com.capstone.be.dto.response.savedlist;

import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for SavedList
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavedListResponse {

  private UUID id;
  private String name;
  private Long docCount;
  private Instant createdAt;
  private Instant updatedAt;
}
