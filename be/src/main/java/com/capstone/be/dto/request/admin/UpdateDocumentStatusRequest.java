package com.capstone.be.dto.request.admin;

import com.capstone.be.domain.enums.DocStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdateDocumentStatusRequest {

  @NotNull(message = "Status is required")
  private DocStatus status;
}


