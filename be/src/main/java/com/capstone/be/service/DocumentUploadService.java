package com.capstone.be.service;

import com.capstone.be.dto.request.document.UploadDocumentInfoRequest;
import com.capstone.be.dto.response.document.DocumentUploadResponse;
import java.util.UUID;
import org.springframework.web.multipart.MultipartFile;

/**
 * Luồng upload document: nhận file, kiểm tra, lưu trữ, sinh thumbnail, chuyển định dạng,
 * đẩy sang kiểm duyệt AI.
 *
 * <p>Tách khỏi DocumentService vì ba phụ thuộc chỉ luồng này dùng —
 * AiDocumentModerationAndSummarizationService, DocumentConversionService,
 * DocumentThumbnailService — và chúng là phần nặng nhất về hạ tầng.
 */
public interface DocumentUploadService {

  DocumentUploadResponse uploadDocument(
      UUID uploaderId,
      UploadDocumentInfoRequest request,
      MultipartFile file
  );
}
