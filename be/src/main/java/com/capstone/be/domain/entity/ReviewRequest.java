package com.capstone.be.domain.entity;

import com.capstone.be.domain.entity.common.BaseEntity;
import com.capstone.be.domain.enums.ReviewRequestStatus;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.experimental.SuperBuilder;

import java.time.Instant;

/**
 * Entity quản lý lời mời review tài liệu
 * BA assign tài liệu cho Reviewer, Reviewer có thể chấp nhận hoặc từ chối
 */
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@SuperBuilder
@Entity
@Table(name = "review_request")
public class ReviewRequest extends BaseEntity {

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "document_id", nullable = false)
  private Document document;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "reviewer_id", nullable = false)
  private User reviewer;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "assigned_by_id", nullable = false)
  private User assignedBy;  // Business Admin người assign

  @Column(nullable = false)
  @Enumerated(EnumType.STRING)
  private ReviewRequestStatus status;

  @Column(name = "response_deadline", nullable = false)
  private Instant responseDeadline;  // Deadline để phản hồi (1 ngày, làm tròn 0h ngày sau)

  @Column(name = "review_deadline")
  private Instant reviewDeadline;  // Deadline để hoàn thành review (3 ngày, làm tròn 0h ngày sau)

  @Column(name = "responded_at")
  private Instant respondedAt;  // Thời điểm reviewer phản hồi

  @Column(columnDefinition = "TEXT")
  private String rejectionReason;  // Lý do từ chối (nếu có)

  @Column(columnDefinition = "TEXT")
  private String note;  // Ghi chú từ BA khi assign
}
