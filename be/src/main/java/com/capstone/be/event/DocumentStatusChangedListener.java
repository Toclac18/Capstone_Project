package com.capstone.be.event;

import com.capstone.be.service.EmailService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;
import org.springframework.stereotype.Component;

/**
 * Gửi email cho người tải lên khi document đổi trạng thái.
 *
 * <p>Trước đây việc này nằm trong thân {@code DocumentServiceImpl}
 * ({@code notifyDocumentOwnerStatusChange}), nên luồng nghiệp vụ phải giữ phụ thuộc
 * {@code EmailService} chỉ để làm một việc phụ.
 *
 * <p>{@code AFTER_COMMIT} sửa luôn một lỗi tiềm ẩn: trước đây email gửi NGAY TRONG
 * transaction, nên nếu transaction rollback sau đó thì người dùng vẫn đã nhận email
 * về một thay đổi không xảy ra. Giờ chỉ gửi khi thay đổi đã thực sự được ghi.
 *
 * <p>Vẫn là best-effort: email lỗi thì chỉ log, không làm gì thêm — việc đổi trạng
 * thái đã commit xong từ trước.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DocumentStatusChangedListener {

  private final EmailService emailService;

  @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
  public void onDocumentStatusChanged(DocumentStatusChangedEvent event) {
    if (event.uploaderEmail() == null) {
      return;
    }
    try {
      emailService.sendDocumentStatusUpdateEmail(
          event.uploaderEmail(),
          event.uploaderName(),
          event.documentTitle(),
          event.newStatus(),
          event.reason()
      );
    } catch (Exception e) {
      log.warn("Failed to send document status update email for document {}: {}",
          event.documentId(), e.getMessage());
    }
  }
}
