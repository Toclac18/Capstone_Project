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
 * Mọi phép ghi của luồng review: giao reviewer, reviewer phản hồi, gửi kết quả,
 * Business Admin duyệt kết quả.
 *
 * <p>Tách khỏi {@link ReviewRequestQueryService} để một bean chỉ đọc không thể
 * vô tình ghi, và hai nhóm có ngữ nghĩa transaction khác nhau không nằm chung class.
 */
public interface ReviewRequestCommandService {

  ReviewRequestResponse assignReviewer(UUID businessAdminId, UUID documentId,
      AssignReviewerRequest request);

  ReviewRequestResponse respondToReviewRequest(UUID reviewerId, UUID reviewRequestId,
      RespondReviewRequestRequest request);

  ReviewResultResponse submitReview(UUID reviewerId, UUID reviewRequestId,
      SubmitReviewRequest request,
      org.springframework.web.multipart.MultipartFile reportFile);

  ReviewResultResponse approveReviewResult(UUID businessAdminId, UUID reviewId,
      ApproveReviewResultRequest request);
}
