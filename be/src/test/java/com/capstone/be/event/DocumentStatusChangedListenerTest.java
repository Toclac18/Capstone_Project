package com.capstone.be.event;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.service.EmailService;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DocumentStatusChangedListenerTest {

  @Mock
  private EmailService emailService;

  @InjectMocks
  private DocumentStatusChangedListener listener;

  private static DocumentStatusChangedEvent event(String email, String name) {
    return new DocumentStatusChangedEvent(
        UUID.randomUUID(), "Giáo trình Toán", email, name,
        DocStatus.ACTIVE, "Activated by Business Admin");
  }

  @Test
  @DisplayName("Có email: gửi đúng các giá trị từ event")
  void sendsEmailWithEventValues() {
    DocumentStatusChangedEvent e = event("reader@example.com", "Nguyễn Văn A");

    listener.onDocumentStatusChanged(e);

    verify(emailService).sendDocumentStatusUpdateEmail(
        eq("reader@example.com"),
        eq("Nguyễn Văn A"),
        eq("Giáo trình Toán"),
        eq(DocStatus.ACTIVE),
        eq("Activated by Business Admin"));
  }

  @Test
  @DisplayName("Không có email người tải lên: không gọi EmailService")
  void skipsWhenNoUploaderEmail() {
    listener.onDocumentStatusChanged(event(null, null));

    verifyNoInteractions(emailService);
  }

  @Test
  @DisplayName("EmailService ném lỗi: listener không ném ra ngoài")
  void swallowsEmailFailure() {
    doThrow(new RuntimeException("SMTP down"))
        .when(emailService)
        .sendDocumentStatusUpdateEmail(anyString(), anyString(), anyString(), any(), anyString());

    // Việc đổi trạng thái đã commit xong; email lỗi không được làm gì thêm.
    listener.onDocumentStatusChanged(event("reader@example.com", "Nguyễn Văn A"));

    verify(emailService).sendDocumentStatusUpdateEmail(
        anyString(), anyString(), anyString(), any(), anyString());
  }

  @Test
  @DisplayName("Chạy SAU khi transaction commit, không phải trong transaction")
  void listensAfterCommit() throws Exception {
    var m = DocumentStatusChangedListener.class
        .getMethod("onDocumentStatusChanged", DocumentStatusChangedEvent.class);
    var ann = m.getAnnotation(
        org.springframework.transaction.event.TransactionalEventListener.class);

    // Trước đây email gửi ngay trong transaction: rollback thì người dùng vẫn
    // đã nhận email về một thay đổi không xảy ra.
    org.assertj.core.api.Assertions.assertThat(ann).isNotNull();
    org.assertj.core.api.Assertions.assertThat(ann.phase())
        .isEqualTo(org.springframework.transaction.event.TransactionPhase.AFTER_COMMIT);
  }
}
