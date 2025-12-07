package com.capstone.be.config.seed;

import com.capstone.be.config.seed.event.DocumentSeededEvent;
import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.DocumentReview;
import com.capstone.be.domain.entity.ReviewRequest;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.ReviewDecision;
import com.capstone.be.domain.enums.ReviewRequestStatus;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.DocumentReviewRepository;
import com.capstone.be.repository.ReviewRequestRepository;
import com.capstone.be.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Profile;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Seeder for ReviewRequest and DocumentReview entities (dev profile only)
 * Creates sample review requests and completed reviews for testing
 */
@Profile("dev")
@Component
@RequiredArgsConstructor
@Slf4j
public class DocumentReviewSeeder {

  private final ReviewRequestRepository reviewRequestRepository;
  private final DocumentReviewRepository documentReviewRepository;
  private final UserRepository userRepository;
  private final DocumentRepository documentRepository;

  @Transactional
  @EventListener(DocumentSeededEvent.class)
  public void run() {
    log.info("🌱 Start seeding ReviewRequest & DocumentReview");

    if (reviewRequestRepository.count() > 0) {
      log.warn("ReviewRequest already exist → skip seeding.");
      return;
    }

    // Lấy users và documents từ DB
    User businessAdmin = userRepository.findByEmail("business1@capstone.com").orElse(null);
    User reviewer1 = userRepository.findByEmail("reviewer1@gmail.com").orElse(null);
    List<Document> documents = documentRepository.findAll();

    if (businessAdmin == null || reviewer1 == null || documents.isEmpty()) {
      log.warn("⚠️ Missing required data (admin, reviewer, or documents). Skipping review seeding.");
      return;
    }

    Instant now = Instant.now();

    // Scenario 1: PENDING - Reviewer chưa phản hồi
    if (documents.size() > 0) {
      ReviewRequest pendingRequest = createReviewRequest(
          documents.get(0),
          reviewer1,
          businessAdmin,
          ReviewRequestStatus.PENDING,
          now.plus(1, ChronoUnit.DAYS), // response deadline: 1 ngày sau
          null, // chưa có review deadline
          null, // chưa responded
          null, // không có rejection reason
          "Vui lòng review tài liệu này trong vòng 1 ngày. Cảm ơn!",
          0
      );
      reviewRequestRepository.save(pendingRequest);
      log.info("✅ Created PENDING ReviewRequest for: {}", documents.get(0).getTitle());
    }

    // Scenario 2: ACCEPTED - Reviewer đã chấp nhận, đang trong quá trình review
    if (documents.size() > 1) {
      Instant respondedAt = now.minus(1, ChronoUnit.DAYS);
      ReviewRequest acceptedRequest = createReviewRequest(
          documents.get(1),
          reviewer1,
          businessAdmin,
          ReviewRequestStatus.ACCEPTED,
          now.minus(2, ChronoUnit.DAYS), // response deadline đã qua
          now.plus(2, ChronoUnit.DAYS), // review deadline: 2 ngày sau
          respondedAt,
          null,
          "Đây là tài liệu quan trọng, cần review kỹ lưỡng.",
          1
      );
      reviewRequestRepository.save(acceptedRequest);
      log.info("✅ Created ACCEPTED ReviewRequest for: {}", documents.get(1).getTitle());
    }

    // Scenario 3: COMPLETED - Reviewer đã submit review
    if (documents.size() > 2) {
      Instant respondedAt = now.minus(4, ChronoUnit.DAYS);
      Instant submittedAt = now.minus(1, ChronoUnit.DAYS);

      ReviewRequest completedRequest = createReviewRequest(
          documents.get(2),
          reviewer1,
          businessAdmin,
          ReviewRequestStatus.COMPLETED,
          now.minus(5, ChronoUnit.DAYS), // response deadline đã qua
          now.minus(2, ChronoUnit.DAYS), // review deadline đã qua
          respondedAt,
          null,
          "Cần review tài liệu này ASAP.",
          2
      );
      ReviewRequest savedRequest = reviewRequestRepository.save(completedRequest);
      log.info("✅ Created COMPLETED ReviewRequest for: {}", documents.get(2).getTitle());

      // Tạo DocumentReview tương ứng
      DocumentReview review = createDocumentReview(
          savedRequest,
          documents.get(2),
          reviewer1,
          "Tài liệu này có chất lượng tốt, nội dung chính xác và phù hợp với chuyên ngành. "
              + "Tuy nhiên, cần bổ sung thêm tài liệu tham khảo ở phần cuối. "
              + "Nhìn chung, tôi đề xuất phê duyệt tài liệu này.",
          "s3://bucket/reviews/review-report-1.docx",
          ReviewDecision.APPROVED,
          submittedAt,
          0
      );
      documentReviewRepository.save(review);
      log.info("✅ Created DocumentReview (APPROVED) for: {}", documents.get(2).getTitle());
    }

    // Scenario 4: REJECTED request - Reviewer từ chối review
    if (documents.size() > 0) {
      Instant respondedAt = now.minus(2, ChronoUnit.DAYS);

      ReviewRequest rejectedRequest = createReviewRequest(
          documents.get(0), // Reuse first document for another scenario
          reviewer1,
          businessAdmin,
          ReviewRequestStatus.REJECTED,
          now.minus(3, ChronoUnit.DAYS),
          null, // không có review deadline vì đã reject
          respondedAt,
          "Tôi không có chuyên môn về lĩnh vực này, xin lỗi không thể nhận review.",
          "Đây là tài liệu về Toán học, cần reviewer có chuyên môn phù hợp.",
          3
      );
      reviewRequestRepository.save(rejectedRequest);
      log.info("✅ Created REJECTED ReviewRequest");
    }

    // Scenario 5: Another COMPLETED with REJECTED decision
    if (documents.size() > 1) {
      Instant respondedAt = now.minus(3, ChronoUnit.DAYS);
      Instant submittedAt = now.minus(1, ChronoUnit.HOURS);

      ReviewRequest completedRequest2 = createReviewRequest(
          documents.get(1), // Reuse second document
          reviewer1,
          businessAdmin,
          ReviewRequestStatus.COMPLETED,
          now.minus(4, ChronoUnit.DAYS),
          now.minus(1, ChronoUnit.DAYS),
          respondedAt,
          null,
          "Review tài liệu Java này giúp tôi.",
          4
      );
      ReviewRequest savedRequest2 = reviewRequestRepository.save(completedRequest2);
      log.info("✅ Created second COMPLETED ReviewRequest");

      DocumentReview review2 = createDocumentReview(
          savedRequest2,
          documents.get(1),
          reviewer1,
          "Tài liệu này có nhiều sai sót về mặt kỹ thuật. "
              + "Các ví dụ code không chạy được và thiếu giải thích rõ ràng. "
              + "Cần chỉnh sửa lại trước khi publish. Tôi không thể phê duyệt tài liệu này.",
          "s3://bucket/reviews/review-report-2.docx",
          ReviewDecision.REJECTED,
          submittedAt,
          1
      );
      documentReviewRepository.save(review2);
      log.info("✅ Created DocumentReview (REJECTED)");
    }

    log.info("Seeded ReviewRequests and DocumentReviews (5 requests, 2 reviews)");
  }

  private ReviewRequest createReviewRequest(
      Document document,
      User reviewer,
      User assignedBy,
      ReviewRequestStatus status,
      Instant responseDeadline,
      Instant reviewDeadline,
      Instant respondedAt,
      String rejectionReason,
      String note,
      int seed
  ) {
    return ReviewRequest.builder()
        .id(SeedUtil.generateUUID("review-request-" + seed))
        .document(document)
        .reviewer(reviewer)
        .assignedBy(assignedBy)
        .status(status)
        .responseDeadline(responseDeadline)
        .reviewDeadline(reviewDeadline)
        .respondedAt(respondedAt)
        .rejectionReason(rejectionReason)
        .note(note)
        .build();
  }

  private DocumentReview createDocumentReview(
      ReviewRequest reviewRequest,
      Document document,
      User reviewer,
      String comment,
      String reportFilePath,
      ReviewDecision decision,
      Instant submittedAt,
      int seed
  ) {
    return DocumentReview.builder()
        .id(SeedUtil.generateUUID("document-review-" + seed))
        .reviewRequest(reviewRequest)
        .document(document)
        .reviewer(reviewer)
        .comment(comment)
        .reportFilePath(reportFilePath)
        .decision(decision)
        .submittedAt(submittedAt)
        .build();
  }
}
