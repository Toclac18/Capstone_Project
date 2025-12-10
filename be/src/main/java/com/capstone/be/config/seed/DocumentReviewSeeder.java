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
    List<User> allReviewers = userRepository.findAll().stream()
        .filter(u -> u.getRole() == com.capstone.be.domain.enums.UserRole.REVIEWER
            && u.getStatus() == com.capstone.be.domain.enums.UserStatus.ACTIVE)
        .toList();
    List<Document> documents = documentRepository.findAll();

    if (businessAdmin == null || allReviewers.isEmpty() || documents.isEmpty()) {
      log.warn("⚠️ Missing required data (admin, reviewers, or documents). Skipping review seeding.");
      return;
    }

    Instant now = Instant.now();
    
    // Get at least 5 reviewers (or all available if less than 5)
    List<User> reviewers = allReviewers.size() >= 5 
        ? allReviewers.subList(0, 5) 
        : allReviewers;
    
    log.info("Using {} reviewers for seeding", reviewers.size());

    int seedIndex = 0;
    int docIndex = 0;
    
    // Create reviews from last 7 days (for trending reviewers)
    // Each reviewer gets multiple reviews to ensure they appear in trending
    for (int reviewerIdx = 0; reviewerIdx < reviewers.size(); reviewerIdx++) {
      User reviewer = reviewers.get(reviewerIdx);
      
      // Create 3-5 reviews per reviewer in the last 7 days
      int reviewsPerReviewer = 3 + (reviewerIdx % 3); // 3, 4, or 5 reviews
      
      for (int i = 0; i < reviewsPerReviewer && docIndex < documents.size(); i++) {
        Document doc = documents.get(docIndex % documents.size());
        
        // Reviews submitted within last 7 days (distributed across days)
        Instant submittedAt = now.minus(i, ChronoUnit.DAYS).minus(reviewerIdx * 2, ChronoUnit.HOURS);
        Instant respondedAt = submittedAt.minus(1, ChronoUnit.DAYS);
        
        ReviewRequest completedRequest = createReviewRequest(
            doc,
            reviewer,
            businessAdmin,
            ReviewRequestStatus.COMPLETED,
            submittedAt.minus(2, ChronoUnit.DAYS),
            submittedAt.minus(1, ChronoUnit.DAYS),
            respondedAt,
            null,
            "Review request for trending test #" + (seedIndex + 1),
            seedIndex
        );
        ReviewRequest savedRequest = reviewRequestRepository.save(completedRequest);
        
        // Alternate between APPROVED and REJECTED
        ReviewDecision decision = (i % 2 == 0) ? ReviewDecision.APPROVED : ReviewDecision.REJECTED;
        String comment = decision == ReviewDecision.APPROVED
            ? "This document has been thoroughly reviewed. The content is accurate and well-structured. I recommend approval."
            : "The document has some issues that need to be addressed before approval.";
        
        DocumentReview review = createDocumentReview(
            savedRequest,
            doc,
            reviewer,
            comment,
            "s3://bucket/reviews/review-report-" + seedIndex + ".docx",
            decision,
            submittedAt,
            seedIndex
        );
        documentReviewRepository.save(review);
        
        log.info("✅ Created review #{}: Reviewer '{}' → Document '{}' (submitted {} days ago)", 
            seedIndex + 1, reviewer.getEmail(), doc.getTitle(), i);
        
        seedIndex++;
        docIndex++;
      }
    }
    
    // Create additional reviews from all-time (older than 7 days) for fallback testing
    // These will be used if we don't have enough reviewers from last 7 days
    int allTimeReviewCount = Math.min(10, documents.size() - docIndex);
    for (int i = 0; i < allTimeReviewCount; i++) {
      Document doc = documents.get(docIndex % documents.size());
      User reviewer = reviewers.get(i % reviewers.size());
      
      // Reviews submitted 8-30 days ago
      Instant submittedAt = now.minus(8 + (i % 22), ChronoUnit.DAYS);
      Instant respondedAt = submittedAt.minus(1, ChronoUnit.DAYS);
      
      ReviewRequest completedRequest = createReviewRequest(
          doc,
          reviewer,
          businessAdmin,
          ReviewRequestStatus.COMPLETED,
          submittedAt.minus(2, ChronoUnit.DAYS),
          submittedAt.minus(1, ChronoUnit.DAYS),
          respondedAt,
          null,
          "All-time review for fallback test #" + (seedIndex + 1),
          seedIndex
      );
      ReviewRequest savedRequest = reviewRequestRepository.save(completedRequest);
      
      ReviewDecision decision = (i % 3 == 0) ? ReviewDecision.REJECTED : ReviewDecision.APPROVED;
      String comment = "This is an older review from all-time period.";
      
      DocumentReview review = createDocumentReview(
          savedRequest,
          doc,
          reviewer,
          comment,
          "s3://bucket/reviews/review-report-alltime-" + seedIndex + ".docx",
          decision,
          submittedAt,
          seedIndex
      );
      documentReviewRepository.save(review);
      
      log.info("✅ Created all-time review #{}: Reviewer '{}' → Document '{}' (submitted {} days ago)", 
          seedIndex + 1, reviewer.getEmail(), doc.getTitle(), 8 + (i % 22));
      
      seedIndex++;
      docIndex++;
    }

    log.info("✅ Seeded {} ReviewRequests and DocumentReviews (from {} reviewers)", 
        seedIndex, reviewers.size());
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
