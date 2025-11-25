package com.capstone.be.dto.request.savedlist;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for creating a new SavedList and optionally adding a document
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateSavedListRequest {

  @NotBlank(message = "Name is required")
  @Size(max = 255, message = "Name must not exceed 255 characters")
  private String name;

  // Optional: document to add immediately after creating the list
  private UUID documentId;
}
