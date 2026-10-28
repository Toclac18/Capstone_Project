package com.capstone.be.service.impl;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.service.DocumentCommandService;
import com.capstone.be.service.DocumentQueryService;
import com.capstone.be.service.DocumentUploadService;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

/**
 * Facade chuyển tiếp đúng chỗ.
 *
 * <p>Compiler đã đảm bảo không thiếu phương thức nào (chúng là abstract trong
 * DocumentService). Cái compiler KHÔNG bắt được là chuyển tiếp sai chỗ giữa hai
 * phương thức cùng chữ ký — getDocumentDetail vs getDocumentDetailForAdmin,
 * getUploadHistory vs getReadHistory, activate vs deactivate. Test này nhắm vào đó.
 */
@ExtendWith(MockitoExtension.class)
class DocumentServiceFacadeTest {

  @Mock private DocumentQueryService queryService;
  @Mock private DocumentCommandService commandService;
  @Mock private DocumentUploadService uploadService;

  @InjectMocks private DocumentServiceImpl facade;

  private final UUID userId = UUID.randomUUID();
  private final UUID docId = UUID.randomUUID();

  @Test
  @DisplayName("getDocumentDetail không bị lẫn với bản ForAdmin")
  void detailVsAdminDetail() {
    facade.getDocumentDetail(userId, docId);

    verify(queryService).getDocumentDetail(eq(userId), eq(docId));
    verify(queryService, org.mockito.Mockito.never()).getDocumentDetailForAdmin(any());
  }

  @Test
  @DisplayName("getDocumentDetailForAdmin không bị lẫn với bản thường")
  void adminDetailVsDetail() {
    facade.getDocumentDetailForAdmin(docId);

    verify(queryService).getDocumentDetailForAdmin(eq(docId));
    verify(queryService, org.mockito.Mockito.never()).getDocumentDetail(any(), any());
  }

  @Test
  @DisplayName("getUploadHistory không bị lẫn với getReadHistory")
  void uploadHistoryVsReadHistory() {
    Pageable page = Pageable.unpaged();

    facade.getReadHistory(userId, page);

    verify(queryService).getReadHistory(eq(userId), eq(page));
    verify(queryService, org.mockito.Mockito.never()).getUploadHistory(any(), any(), any());
  }

  @Test
  @DisplayName("activate và deactivate không bị đổi chỗ")
  void activateVsDeactivate() {
    facade.activateDocument(docId);
    verify(commandService).activateDocument(eq(docId));
    verify(commandService, org.mockito.Mockito.never()).deactivateDocument(any());

    facade.deactivateDocument(docId);
    verify(commandService).deactivateDocument(eq(docId));
  }

  @Test
  @DisplayName("getDocumentPresignedUrl đi vào CommandService, không phải QueryService")
  void presignedUrlIsACommand() {
    // Tên là "get" nhưng nó ghi lịch sử đọc nên là @Transactional, không readOnly.
    facade.getDocumentPresignedUrl(userId, docId);

    verify(commandService).getDocumentPresignedUrl(eq(userId), eq(docId));
    verifyNoInteractions(queryService);
  }

  @Test
  @DisplayName("updateDocumentStatus truyền status xuống nguyên vẹn")
  void statusPassedThrough() {
    facade.updateDocumentStatus(docId, DocStatus.REJECTED);

    verify(commandService).updateDocumentStatus(eq(docId), eq(DocStatus.REJECTED));
  }

  @Test
  @DisplayName("uploadDocument đi vào UploadService")
  void uploadGoesToUploadService() {
    facade.uploadDocument(userId, null, null);

    verify(uploadService).uploadDocument(eq(userId), eq(null), eq(null));
    verifyNoInteractions(queryService, commandService);
  }
}
