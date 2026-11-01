package com.capstone.be.service.impl;

import com.capstone.be.domain.enums.ReviewResultStatus;
import com.capstone.be.dto.request.review.ApproveReviewResultRequest;
import com.capstone.be.dto.request.review.AssignReviewerRequest;
import com.capstone.be.dto.request.review.RespondReviewRequestRequest;
import com.capstone.be.dto.request.review.ReviewHistoryFilterRequest;
import com.capstone.be.dto.request.review.ReviewManagementFilterRequest;
import com.capstone.be.dto.request.review.SubmitReviewRequest;
import com.capstone.be.dto.response.review.ReviewManagementItem;
import com.capstone.be.dto.response.review.ReviewRequestResponse;
import com.capstone.be.dto.response.review.ReviewResultResponse;
import com.capstone.be.service.ReviewRequestCommandService;
import com.capstone.be.service.ReviewRequestQueryService;
import com.capstone.be.service.ReviewRequestService;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Facade giữ nguyên {@link ReviewRequestService} để hai controller không phải đổi.
 *
 * <p>Logic đã chuyển sang {@link ReviewRequestQueryService} (10 phương thức đọc, tất cả
 * readOnly) và {@link ReviewRequestCommandService} (4 phương thức ghi).
 *
 * <p>KHÔNG đặt @Transactional ở đây: transaction boundary thuộc hai service kia.
 *
 * <p>Code mới nên gọi thẳng service tương ứng. Khi
 * ReviewRequestController và AdminReviewRequestController đã chuyển hết, xoá facade này.
 */
@Service
@RequiredArgsConstructor
public class ReviewRequestServiceImpl implements ReviewRequestService {

  private final ReviewRequestQueryService queryService;
  private final ReviewRequestCommandService commandService;

  // ─────────────────────── ghi ───────────────────────

  @Override
  public ReviewRequestResponse assignReviewer(
      UUID businessAdminId, UUID documentId, AssignReviewerRequest request) {
    return commandService.assignReviewer(businessAdminId, documentId, request);
  }

  @Override
  public ReviewRequestResponse respondToReviewRequest(
      UUID reviewerId, UUID reviewRequestId, RespondReviewRequestRequest request) {
    return commandService.respondToReviewRequest(reviewerId, reviewRequestId, request);
  }

  @Override
  public ReviewResultResponse submitReview(
      UUID reviewerId, UUID reviewRequestId, SubmitReviewRequest request,
      MultipartFile reportFile) {
    return commandService.submitReview(reviewerId, reviewRequestId, request, reportFile);
  }

  @Override
  public ReviewResultResponse approveReviewResult(
      UUID businessAdminId, UUID reviewId, ApproveReviewResultRequest request) {
    return commandService.approveReviewResult(businessAdminId, reviewId, request);
  }

  // ─────────────────────── đọc ───────────────────────

  @Override
  public Page<ReviewRequestResponse> getReviewerPendingRequests(
      UUID reviewerId, Pageable pageable) {
    return queryService.getReviewerPendingRequests(reviewerId, pageable);
  }

  @Override
  public Page<ReviewRequestResponse> getReviewerAllRequests(UUID reviewerId, Pageable pageable) {
    return queryService.getReviewerAllRequests(reviewerId, pageable);
  }

  @Override
  public Page<ReviewRequestResponse> getReviewerToDoDocuments(
      UUID reviewerId, Pageable pageable) {
    return queryService.getReviewerToDoDocuments(reviewerId, pageable);
  }

  @Override
  public Page<ReviewRequestResponse> getDocumentReviewRequests(
      UUID documentId, Pageable pageable) {
    return queryService.getDocumentReviewRequests(documentId, pageable);
  }

  @Override
  public Page<ReviewRequestResponse> getAllReviewRequests(Pageable pageable) {
    return queryService.getAllReviewRequests(pageable);
  }

  @Override
  public Page<ReviewResultResponse> getReviewerHistory(
      UUID reviewerId, ReviewHistoryFilterRequest filter, Pageable pageable) {
    return queryService.getReviewerHistory(reviewerId, filter, pageable);
  }

  @Override
  public ReviewResultResponse getReviewResultByReviewRequestId(UUID reviewRequestId) {
    return queryService.getReviewResultByReviewRequestId(reviewRequestId);
  }

  @Override
  public Page<ReviewResultResponse> getPendingReviewResults(Pageable pageable) {
    return queryService.getPendingReviewResults(pageable);
  }

  @Override
  public Page<ReviewResultResponse> getAllReviewResults(
      ReviewResultStatus status, Pageable pageable) {
    return queryService.getAllReviewResults(status, pageable);
  }

  @Override
  public Page<ReviewManagementItem> getReviewManagementList(
      ReviewManagementFilterRequest filter, Pageable pageable) {
    return queryService.getReviewManagementList(filter, pageable);
  }
}
