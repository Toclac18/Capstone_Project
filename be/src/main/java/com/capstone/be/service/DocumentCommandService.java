package com.capstone.be.service;

import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.DocVisibility;
import com.capstone.be.dto.request.document.DocumentLibraryFilter;
import com.capstone.be.dto.request.document.DocumentSearchFilter;
import com.capstone.be.dto.request.document.DocumentUploadHistoryFilter;
import com.capstone.be.dto.request.document.UpdateDocumentRequest;
import com.capstone.be.dto.response.document.*;
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Mọi phép ghi document: đổi nội dung, đổi trạng thái, xoá, đổi điểm.
 *
 * <p>getDocumentPresignedUrl nằm ở đây dù tên là "get": nó ghi lịch sử đọc nên là
 * @Transactional, không readOnly.
 */
public interface DocumentCommandService {

  void redeemDocument(UUID readerId, UUID documentId);

  DocumentPresignedUrlResponse getDocumentPresignedUrl(UUID userId, UUID documentId);

  DocumentUploadResponse updateDocument(UUID uploaderId, UUID documentId,
      UpdateDocumentRequest request);

  void deleteDocument(UUID uploaderId, UUID documentId);

  void activateDocument(UUID documentId);

  void deactivateDocument(UUID documentId);

  void updateDocumentStatus(UUID documentId, DocStatus status);
}
