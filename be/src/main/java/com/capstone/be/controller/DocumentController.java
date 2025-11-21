package com.capstone.be.controller;

import com.capstone.be.dto.request.document.UploadDocumentInfoRequest;
import com.capstone.be.dto.response.document.DocumentUploadResponse;
import com.capstone.be.security.model.UserPrincipal;
import com.capstone.be.service.DocumentService;
import jakarta.validation.Valid;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

/**
 * Controller for document management
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/documents")
@RequiredArgsConstructor
public class DocumentController {

  private final DocumentService documentService;

  /**
   * Upload a document POST /api/v1/documents/upload
   *
   * @param userPrincipal Authenticated user (uploader)
   * @param info          Document information
   * @param file          PDF file to upload
   * @return Document upload response
   */
  @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @PreAuthorize("hasAnyRole('READER', 'ORGANIZATION_ADMIN')")
  public ResponseEntity<DocumentUploadResponse> uploadDocument(
      @AuthenticationPrincipal UserPrincipal userPrincipal,
      @Valid @RequestPart(name = "info") UploadDocumentInfoRequest info,
      @RequestPart(name = "file") MultipartFile file) {
    UUID uploaderId = userPrincipal.getId();
    log.info("User {} uploading document: {}", uploaderId, info.getTitle());

    DocumentUploadResponse response = documentService.uploadDocument(
        uploaderId, info, file);

    return ResponseEntity.status(HttpStatus.CREATED).body(response);
  }
}
