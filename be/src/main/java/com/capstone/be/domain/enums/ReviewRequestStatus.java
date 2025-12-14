package com.capstone.be.domain.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ReviewRequestStatus {
  PENDING("Pending"),           // Chờ reviewer phản hồi
  ACCEPTED("Accepted"),         // Reviewer đồng ý
  REJECTED("Rejected"),         // Reviewer từ chối
  EXPIRED("Expired"),           // Quá hạn 1 ngày không phản hồi
  COMPLETED("Completed");       // Review đã được submit

  private final String displayName;
}
