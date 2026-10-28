package com.capstone.be.service.impl;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

import com.capstone.be.domain.enums.ReviewResultStatus;
import com.capstone.be.service.ReviewRequestCommandService;
import com.capstone.be.service.ReviewRequestQueryService;
import java.util.UUID;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Pageable;

/**
 * Facade chuyển tiếp đúng chỗ.
 *
 * <p>Compiler đã đảm bảo không thiếu phương thức nào. Cái nó KHÔNG bắt được là
 * chuyển tiếp sai chỗ giữa những phương thức cùng chữ ký — ở đây có bốn cặp như vậy
 * nhận (UUID, Pageable), và hai cặp "pending" / "all".
 */
@ExtendWith(MockitoExtension.class)
class ReviewRequestServiceFacadeTest {

  @Mock private ReviewRequestQueryService queryService;
  @Mock private ReviewRequestCommandService commandService;

  @InjectMocks private ReviewRequestServiceImpl facade;

  private final UUID reviewerId = UUID.randomUUID();
  private final UUID docId = UUID.randomUUID();
  private final Pageable page = Pageable.unpaged();

  @Test
  @DisplayName("Bốn phương thức (UUID, Pageable) không bị lẫn vào nhau")
  void fourSameSignatureReadsDoNotSwap() {
    facade.getReviewerPendingRequests(reviewerId, page);
    verify(queryService).getReviewerPendingRequests(eq(reviewerId), eq(page));
    verify(queryService, never()).getReviewerAllRequests(any(), any());
    verify(queryService, never()).getReviewerToDoDocuments(any(), any());
    verify(queryService, never()).getDocumentReviewRequests(any(), any());

    facade.getReviewerToDoDocuments(reviewerId, page);
    verify(queryService).getReviewerToDoDocuments(eq(reviewerId), eq(page));

    facade.getDocumentReviewRequests(docId, page);
    verify(queryService).getDocumentReviewRequests(eq(docId), eq(page));

    facade.getReviewerAllRequests(reviewerId, page);
    verify(queryService).getReviewerAllRequests(eq(reviewerId), eq(page));
  }

  @Test
  @DisplayName("getPendingReviewResults không bị lẫn với getAllReviewResults")
  void pendingVsAllResults() {
    facade.getPendingReviewResults(page);

    verify(queryService).getPendingReviewResults(eq(page));
    verify(queryService, never()).getAllReviewResults(any(), any());
  }

  @Test
  @DisplayName("getAllReviewResults truyền status xuống nguyên vẹn")
  void allResultsPassesStatus() {
    facade.getAllReviewResults(ReviewResultStatus.PENDING, page);

    verify(queryService).getAllReviewResults(eq(ReviewResultStatus.PENDING), eq(page));
  }

  @Test
  @DisplayName("Bốn phương thức ghi đi vào CommandService, không chạm QueryService")
  void writesGoToCommandService() {
    facade.assignReviewer(reviewerId, docId, null);
    facade.respondToReviewRequest(reviewerId, docId, null);
    facade.submitReview(reviewerId, docId, null, null);
    facade.approveReviewResult(reviewerId, docId, null);

    verify(commandService).assignReviewer(eq(reviewerId), eq(docId), eq(null));
    verify(commandService).respondToReviewRequest(eq(reviewerId), eq(docId), eq(null));
    verify(commandService).submitReview(eq(reviewerId), eq(docId), eq(null), eq(null));
    verify(commandService).approveReviewResult(eq(reviewerId), eq(docId), eq(null));
    verifyNoInteractions(queryService);
  }

  @Test
  @DisplayName("getReviewManagementList đi vào QueryService, không chạm CommandService")
  void managementListIsARead() {
    facade.getReviewManagementList(null, page);

    verify(queryService).getReviewManagementList(eq(null), eq(page));
    verifyNoInteractions(commandService);
  }
}
