package com.capstone.be.dto.request.savedlist;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Request DTO for updating SavedList name
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateSavedListRequest {

  @NotBlank(message = "Name is required")
  @Size(max = 255, message = "Name must not exceed 255 characters")
  private String name;
}
