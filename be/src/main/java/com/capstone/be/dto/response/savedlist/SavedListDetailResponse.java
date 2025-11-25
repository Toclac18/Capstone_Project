package com.capstone.be.dto.response.savedlist;

import com.capstone.be.dto.response.document.DocumentLibraryResponse;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Response DTO for SavedList with full document details
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SavedListDetailResponse {

  private UUID id;
  private String name;
  private Long docCount;
  private Instant createdAt;
  private Instant updatedAt;
  private List<DocumentLibraryResponse> documents;
}
