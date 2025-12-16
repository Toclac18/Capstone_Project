package com.capstone.be.domain.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum DocStatus {
  AI_VERIFYING("AI Verifying"),       // Đang được AI kiểm tra
  AI_REJECTED("AI Rejected"),         // AI từ chối
  PENDING_REVIEW("Pending Review"),   // Chờ BA assign reviewer
  REVIEWING("Reviewing"),             // Reviewer đang review
  PENDING_APPROVE("Pending Approve"), // Chờ BA duyệt kết quả review
  ACTIVE("Active"),                   // Đã duyệt, công khai
  REJECTED("Rejected"),               // Bị từ chối
  INACTIVE("Inactive"),
  DELETED("Deleted");

  private final String displayName;
}
