package com.capstone.be.config.seed;

import com.capstone.be.config.seed.event.DocumentSeededEvent;
import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.DocumentReview;
import com.capstone.be.domain.entity.ReviewRequest;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.ReviewDecision;
import com.capstone.be.domain.enums.ReviewRequestStatus;
import com.capstone.be.domain.enums.UserRole;
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
 * Seeder for ReviewRequest and DocumentReview (dev profile only)
 */
@Profile("dev")
@Component
@RequiredArgsConstructor
@Slf4j
public class ReviewRequestSeeder {

  private final ReviewRequestRepository reviewRequestRepository;
  private final DocumentReviewRepository documentReviewRepository;
  private final DocumentRepository documentRepository;
  private final UserRepository userRepository;

  @Transactional
  @EventListener(DocumentSeededEvent.class)
  public void run() {
    log.info("🌱 Start seeding ReviewRequest & DocumentReview");

    if (reviewRequestRepository.count() > 0) {
      log.warn("ReviewRequest already exist → skip seeding.");
      return;
    }

    // Get users
    User businessAdmin = userRepository.findByEmail("business1@capstone.com")
        .orElse(null);
    List<User> allUsers = userRepository.findAll();
    List<User> reviewers = allUsers.stream()
        .filter(u -> u.getRole() == UserRole.REVIEWER)
        .toList();
    List<Document> allDocuments = documentRepository.findAll();
    List<Document> premiumDocuments = allDocuments.stream()
        .filter(d -> Boolean.TRUE.equals(d.getIsPremium()))
        .toList();

    if (businessAdmin == null) {
      log.warn("⚠️ Business Admin not found. Skipping review request seed.");
      return;
    }

    if (reviewers.isEmpty()) {
      log.warn("⚠️ No reviewers found. Skipping review request seed.");
      return;
    }

    if (premiumDocuments.isEmpty()) {
      log.warn("⚠️ No premium documents found. Skipping review request seed.");
      return;
    }

    Instant now = Instant.now();

    // Create review requests with different statuses
    int requestIndex = 0;
    int docIndex = 0;

    // 1. PENDING requests (10 requests) - for testing pending tab
    int pendingCount = Math.min(10, premiumDocuments.size());
    for (int i = 0; i < pendingCount; i++) {
      Document doc = premiumDocuments.get(docIndex % premiumDocuments.size());
      User reviewer = reviewers.get(i % reviewers.size());
      
      ReviewRequest request = ReviewRequest.builder()
          .id(SeedUtil.generateUUID("review-request-pending-" + requestIndex))
          .document(doc)
          .reviewer(reviewer)
          .assignedBy(businessAdmin)
          .status(ReviewRequestStatus.PENDING)
          .responseDeadline(now.plus(1, ChronoUnit.DAYS).plus(i, ChronoUnit.HOURS))
          .reviewDeadline(now.plus(4, ChronoUnit.DAYS).plus(i, ChronoUnit.HOURS))
          .note("Please review this document carefully. Request #" + (i + 1))
          .build();

      reviewRequestRepository.save(request);
      log.info("✅ Created PENDING review request #{}: Document '{}' → Reviewer '{}'", 
          i + 1, doc.getTitle(), reviewer.getEmail());
      requestIndex++;
      docIndex++;
    }

    // 2. ACCEPTED requests (15 requests) - for testing todo tab
    int acceptedCount = Math.min(15, premiumDocuments.size() * 2);
    for (int i = 0; i < acceptedCount; i++) {
      Document doc = premiumDocuments.get(docIndex % premiumDocuments.size());
      User reviewer = reviewers.get(i % reviewers.size());
      
      ReviewRequest request = ReviewRequest.builder()
          .id(SeedUtil.generateUUID("review-request-accepted-" + requestIndex))
          .document(doc)
          .reviewer(reviewer)
          .assignedBy(businessAdmin)
          .status(ReviewRequestStatus.ACCEPTED)
          .responseDeadline(now.minus(1, ChronoUnit.DAYS).minus(i, ChronoUnit.HOURS))
          .reviewDeadline(now.plus(2, ChronoUnit.DAYS).plus(i, ChronoUnit.HOURS))
          .respondedAt(now.minus(12, ChronoUnit.HOURS).minus(i, ChronoUnit.HOURS))
          .note("Reviewer has accepted this request. Todo #" + (i + 1))
          .build();

      reviewRequestRepository.save(request);
      log.info("✅ Created ACCEPTED review request #{}: Document '{}' → Reviewer '{}'", 
          i + 1, doc.getTitle(), reviewer.getEmail());
      requestIndex++;
      docIndex++;
    }

    // 3. REJECTED requests (5 requests)
    int rejectedCount = Math.min(5, premiumDocuments.size());
    for (int i = 0; i < rejectedCount; i++) {
      Document doc = premiumDocuments.get(docIndex % premiumDocuments.size());
      User reviewer = reviewers.get(i % reviewers.size());
      
      String[] rejectionReasons = {
        "I don't have expertise in this domain.",
        "Currently overloaded with other review tasks.",
        "The document is outside my area of specialization.",
        "Unable to commit to the review deadline.",
        "Personal reasons prevent me from taking this review."
      };
      
      ReviewRequest request = ReviewRequest.builder()
          .id(SeedUtil.generateUUID("review-request-rejected-" + requestIndex))
          .document(doc)
          .reviewer(reviewer)
          .assignedBy(businessAdmin)
          .status(ReviewRequestStatus.REJECTED)
          .responseDeadline(now.minus(2, ChronoUnit.DAYS).minus(i, ChronoUnit.HOURS))
          .reviewDeadline(null)
          .respondedAt(now.minus(1, ChronoUnit.DAYS).minus(i, ChronoUnit.HOURS))
          .rejectionReason(rejectionReasons[i % rejectionReasons.length])
          .note("Reviewer rejected this request.")
          .build();

      reviewRequestRepository.save(request);
      log.info("✅ Created REJECTED review request #{}: Document '{}' → Reviewer '{}'", 
          i + 1, doc.getTitle(), reviewer.getEmail());
      requestIndex++;
      docIndex++;
    }

    // 4. COMPLETED requests with DocumentReview (20 requests) - for testing history tab
    // Get all ACCEPTED requests
    List<ReviewRequest> allRequests = reviewRequestRepository.findAll();
    List<ReviewRequest> acceptedRequests = allRequests.stream()
        .filter(r -> r.getStatus() == ReviewRequestStatus.ACCEPTED)
        .limit(20)
        .toList();
    
    String[] reviewComments = {
      "This document has been thoroughly reviewed. The content is accurate, well-structured, and provides valuable insights. I recommend approval.",
      "After careful examination, I found the document to be comprehensive and well-researched. The methodology is sound and the conclusions are supported by evidence.",
      "The document demonstrates high quality research with clear presentation. However, there are some minor areas that could be improved. Overall, I recommend approval.",
      "This is an excellent piece of work with strong theoretical foundations. The practical applications are well-explained. I recommend approval.",
      "The document contains valuable information but lacks depth in certain sections. The writing is clear but could benefit from more examples. I recommend approval with minor revisions.",
      "After thorough review, I found several critical issues with the methodology and data analysis. The conclusions are not well-supported. I recommend rejection.",
      "The document has significant gaps in the literature review and the research design has flaws. The findings are questionable. I recommend rejection.",
      "While the topic is interesting, the document lacks rigor and the arguments are not well-developed. More work is needed before this can be approved.",
      "The document shows promise but requires substantial revision. The core ideas are good but the execution needs improvement. I recommend rejection with suggestions for resubmission.",
      "This document does not meet the quality standards required. The research methodology is flawed and the conclusions are not supported by the data presented."
    };
    
    for (int i = 0; i < acceptedRequests.size(); i++) {
      ReviewRequest request = acceptedRequests.get(i);
      
      // Update request status to COMPLETED
      request.setStatus(ReviewRequestStatus.COMPLETED);
      reviewRequestRepository.save(request);

      // Alternate between APPROVED and REJECTED decisions
      ReviewDecision decision = (i % 3 == 0) ? ReviewDecision.REJECTED : ReviewDecision.APPROVED;
      String comment = reviewComments[i % reviewComments.length];
      
      // Create DocumentReview
      DocumentReview review = DocumentReview.builder()
          .id(SeedUtil.generateUUID("document-review-" + i))
          .reviewRequest(request)
          .document(request.getDocument())
          .reviewer(request.getReviewer())
          .comment(comment)
          .reportFilePath("reviews/review-report-" + i + ".docx")
          .decision(decision)
          .submittedAt(now.minus(i, ChronoUnit.HOURS).minus(i * 2, ChronoUnit.MINUTES))
          .build();

      documentReviewRepository.save(review);

      // Update document status based on review decision (only if not already set)
      Document doc = request.getDocument();
      if (review.getDecision() == ReviewDecision.APPROVED && doc.getStatus() != DocStatus.ACTIVE) {
        doc.setStatus(DocStatus.ACTIVE);
        documentRepository.save(doc);
      } else if (review.getDecision() == ReviewDecision.REJECTED && doc.getStatus() != DocStatus.REJECTED) {
        doc.setStatus(DocStatus.REJECTED);
        documentRepository.save(doc);
      }

      log.info("✅ Created COMPLETED review #{}: Document '{}' → Decision '{}'", 
          i + 1, doc.getTitle(), review.getDecision());
    }

    log.info("✅ ReviewRequest & DocumentReview seeding completed!");
  }
}

