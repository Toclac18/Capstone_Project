package com.capstone.be.service;

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
import java.util.UUID;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

/**
 * Mọi phép đọc của luồng review. Tất cả phương thức đều @Transactional(readOnly = true).
 */
public interface ReviewRequestQueryService {

  Page<ReviewRequestResponse> getReviewerPendingRequests(UUID reviewerId, Pageable pageable);

  Page<ReviewRequestResponse> getReviewerAllRequests(UUID reviewerId, Pageable pageable);

  Page<ReviewRequestResponse> getReviewerToDoDocuments(UUID reviewerId, Pageable pageable);

  Page<ReviewRequestResponse> getDocumentReviewRequests(UUID documentId, Pageable pageable);

  Page<ReviewRequestResponse> getAllReviewRequests(Pageable pageable);

  Page<ReviewResultResponse> getReviewerHistory(UUID reviewerId,
      ReviewHistoryFilterRequest filter, Pageable pageable);

  ReviewResultResponse getReviewResultByReviewRequestId(UUID reviewRequestId);

  Page<ReviewResultResponse> getPendingReviewResults(Pageable pageable);

  Page<ReviewResultResponse> getAllReviewResults(ReviewResultStatus status, Pageable pageable);

  Page<ReviewManagementItem> getReviewManagementList(ReviewManagementFilterRequest filter,
      Pageable pageable);
}
