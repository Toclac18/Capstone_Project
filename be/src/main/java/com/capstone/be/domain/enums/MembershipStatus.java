package com.capstone.be.domain.enums;

public enum MembershipStatus {
  ACTIVE,     // reader đang là thành viên hợp lệ
  PENDING,    // đã gửi lời mời, chưa xác nhận
  REMOVED     // đã rời khỏi org hoặc bị xoá
}
