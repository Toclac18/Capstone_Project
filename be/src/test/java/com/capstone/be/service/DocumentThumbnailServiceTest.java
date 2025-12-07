package com.capstone.be.service;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.capstone.be.service.FileStorageService;
import com.capstone.be.service.impl.DocumentThumbnailServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

@ExtendWith(MockitoExtension.class)
@DisplayName("DocumentThumbnailService Unit Tests")
class DocumentThumbnailServiceTest {

  @Mock
  private FileStorageService fileStorageService;

  @InjectMocks
  private DocumentThumbnailServiceImpl documentThumbnailService;

  private MultipartFile pdfFile;
  private String folder;

  @BeforeEach
  void setUp() {
    folder = "documents/thumbnails";
    pdfFile = new MockMultipartFile("file", "test.pdf", "application/pdf", "pdf content".getBytes());
  }

  // test generateAndUploadThumbnail should return null when file is null
  @Test
  @DisplayName("generateAndUploadThumbnail should return null when file is null")
  void generateAndUploadThumbnail_ShouldReturnNull_WhenFileIsNull() {
    String result = documentThumbnailService.generateAndUploadThumbnail(null, folder);

    assertNull(result);
    verify(fileStorageService, never()).uploadFile(any(), any(), any(), any());
  }

  // test generateAndUploadThumbnail should return null when file is empty
  @Test
  @DisplayName("generateAndUploadThumbnail should return null when file is empty")
  void generateAndUploadThumbnail_ShouldReturnNull_WhenFileIsEmpty() {
    MultipartFile emptyFile = new MockMultipartFile("file", "test.pdf", "application/pdf", new byte[0]);

    String result = documentThumbnailService.generateAndUploadThumbnail(emptyFile, folder);

    assertNull(result);
    verify(fileStorageService, never()).uploadFile(any(), any(), any(), any());
  }

  // test generateAndUploadThumbnail should return null when content type is not PDF
  @Test
  @DisplayName("generateAndUploadThumbnail should return null when content type is not PDF")
  void generateAndUploadThumbnail_ShouldReturnNull_WhenNotPdf() {
    MultipartFile nonPdfFile = new MockMultipartFile("file", "test.txt", "text/plain", "content".getBytes());

    String result = documentThumbnailService.generateAndUploadThumbnail(nonPdfFile, folder);

    assertNull(result);
    verify(fileStorageService, never()).uploadFile(any(), any(), any(), any());
  }
}


