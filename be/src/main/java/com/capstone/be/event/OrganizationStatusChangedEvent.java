package com.capstone.be.event;

import com.capstone.be.domain.enums.UserStatus;
import java.util.UUID;

/**
 * Trạng thái một tổ chức vừa đổi.
 *
 * <p>Người nhận gồm cả admin của tổ chức và MỌI thành viên đã JOINED — việc gửi cho
 * thành viên là một vòng lặp phân trang, trước đây chạy ngay trong transaction ghi.
 *
 * @param adminUserId id user là admin của tổ chức; listener dùng nó để tìm tổ chức
 */
public record OrganizationStatusChangedEvent(
    UUID adminUserId,
    String adminEmail,
    String adminFullName,
    UserStatus newStatus,
    String reason
) {}
