package com.capstone.be.dto.response.document;

import java.util.List;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentListResponse {

  private List<DocumentListItemResponse> documents;
  private Integer total;
  private Integer page;
  private Integer limit;
}

