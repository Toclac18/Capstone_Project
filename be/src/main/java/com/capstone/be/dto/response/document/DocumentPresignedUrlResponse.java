package com.capstone.be.dto.response.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentPresignedUrlResponse {

  private String presignedUrl;
  private Integer expiresInMinutes;
}
