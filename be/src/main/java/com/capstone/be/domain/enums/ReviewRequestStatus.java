package com.capstone.be.domain.enums;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public enum ReviewRequestStatus {
  PENDING("Pending"),           // Chờ reviewer phản hồi (1 ngày)
  ACCEPTED("Accepted"),         // Reviewer đồng ý review
  REJECTED("Rejected"),         // Reviewer từ chối
  EXPIRED("Expired");           // Quá hạn không phản hồi hoặc không submit review

  private final String displayName;
}
