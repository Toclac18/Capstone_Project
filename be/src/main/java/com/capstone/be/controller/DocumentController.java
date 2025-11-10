package com.capstone.be.controller;

import com.capstone.be.dto.base.SuccessResponse;
import com.capstone.be.dto.request.document.DocumentQueryRequest;
import com.capstone.be.dto.response.document.DocumentDetailResponse;
import com.capstone.be.dto.response.document.DocumentListResponse;
import com.capstone.be.service.DocumentService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/documents")
@RequiredArgsConstructor
public class DocumentController {

  private final DocumentService documentService;

  @GetMapping("/{id}")
  public ResponseEntity<SuccessResponse<DocumentDetailResponse>> getDetail(
      @PathVariable UUID id) {
    DocumentDetailResponse response = documentService.getDetail(id);
    return ResponseEntity.status(HttpStatus.OK).body(SuccessResponse.of(response));
  }

  @PostMapping
  public ResponseEntity<SuccessResponse<DocumentListResponse>> query(
      @RequestBody @Valid DocumentQueryRequest request) {
    DocumentListResponse response = documentService.query(request);
    return ResponseEntity.status(HttpStatus.OK).body(SuccessResponse.of(response));
  }

  @DeleteMapping("/{id}")
  public ResponseEntity<SuccessResponse<Void>> delete(@PathVariable UUID id) {
    documentService.delete(id);
    return ResponseEntity.status(HttpStatus.OK).body(SuccessResponse.of(null));
  }
}
