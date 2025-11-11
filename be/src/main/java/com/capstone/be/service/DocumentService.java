package com.capstone.be.service;

import com.capstone.be.dto.request.document.DocumentQueryRequest;
import com.capstone.be.dto.response.document.DocumentDetailResponse;
import com.capstone.be.dto.response.document.DocumentListResponse;
import java.util.UUID;

public interface DocumentService {

  DocumentDetailResponse getDetail(UUID id);

  DocumentListResponse query(DocumentQueryRequest request);

  void delete(UUID id);
}
