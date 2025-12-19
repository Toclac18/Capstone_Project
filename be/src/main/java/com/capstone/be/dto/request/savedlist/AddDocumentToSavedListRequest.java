package com.capstone.be.dto.request.savedlist;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for adding a document to an existing SavedList
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AddDocumentToSavedListRequest {

  @NotNull(message = "Document ID is required")
  private UUID documentId;
}
