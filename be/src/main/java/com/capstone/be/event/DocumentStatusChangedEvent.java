package com.capstone.be.event;

import com.capstone.be.domain.enums.DocStatus;
import java.util.UUID;

/**
 * Trạng thái một document vừa đổi.
 *
 * <p>Mang sẵn mọi giá trị người nhận cần, KHÔNG mang entity: listener chạy sau khi
 * transaction đã commit, lúc đó đọc quan hệ lazy của entity sẽ ném
 * LazyInitializationException. Giá trị được lấy ngay tại chỗ phát event, khi còn
 * trong transaction.
 *
 * @param documentId    id document, dùng để ghi log
 * @param documentTitle tiêu đề document
 * @param uploaderEmail email người tải lên; null nghĩa là không có ai để thông báo
 * @param uploaderName  tên người tải lên
 * @param newStatus     trạng thái mới
 * @param reason        lý do đổi trạng thái, hiển thị trong email
 */
public record DocumentStatusChangedEvent(
    UUID documentId,
    String documentTitle,
    String uploaderEmail,
    String uploaderName,
    DocStatus newStatus,
    String reason
) {}
