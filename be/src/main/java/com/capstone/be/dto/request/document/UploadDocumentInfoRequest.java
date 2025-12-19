package com.capstone.be.dto.request.document;

import com.capstone.be.domain.enums.DocVisibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for uploading a document
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UploadDocumentInfoRequest {

  @NotBlank(message = "Title is required")
  @Size(max = 255, message = "Title must not exceed 255 characters")
  private String title;

  @NotBlank(message = "Description is required")
  @Size(max = 2000, message = "Description must not exceed 2000 characters")
  private String description;

  @NotNull(message = "Visibility is required")
  private DocVisibility visibility;

  @NotNull(message = "Premium status is required")
  private Boolean isPremium;

  @NotNull(message = "Document type is required")
  private UUID docTypeId;

  @NotNull(message = "Specialization is required")
  private UUID specializationId;

  /**
   * Organization ID - optional If null, document is uploaded to the general system If provided,
   * document belongs to that organization
   */
  private UUID organizationId;

  /**
   * Existing tag codes (must be ACTIVE status)
   */
  @Builder.Default
  private List<Long> tagCodes = new ArrayList<>();

  /**
   * New tag names to be created (will have PENDING status)
   */
  @Builder.Default
  private List<String> newTags = new ArrayList<>();
}
