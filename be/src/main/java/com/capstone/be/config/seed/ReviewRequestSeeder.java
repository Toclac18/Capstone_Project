package com.capstone.be.config.seed;

import com.capstone.be.config.seed.event.DocumentSeededEvent;
import com.capstone.be.domain.entity.Document;
import com.capstone.be.domain.entity.ReviewResult;
import com.capstone.be.domain.entity.ReviewRequest;
import com.capstone.be.domain.entity.User;
import com.capstone.be.domain.enums.DocStatus;
import com.capstone.be.domain.enums.ReviewDecision;
import com.capstone.be.domain.enums.ReviewRequestStatus;
import com.capstone.be.domain.enums.ReviewResultStatus;
import com.capstone.be.domain.enums.UserRole;
import com.capstone.be.repository.DocumentRepository;
import com.capstone.be.repository.ReviewResultRepository;
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
 * Seeder for ReviewRequest and ReviewResult (dev profile only)
 * 
 * Creates review data based on document status:
 * - PENDING_REVIEW docs: Create PENDING review requests (waiting for reviewer to accept)
 * - REVIEWING docs: Create ACCEPTED review requests (reviewer working on it)
 * - PENDING_APPROVE docs: Create ACCEPTED requests + PENDING ReviewResult (waiting BA approval)
 * - ACTIVE/REJECTED docs: Create ACCEPTED requests + APPROVED ReviewResult (completed)
 */
@Profile("dev")
@Component
@RequiredArgsConstructor
@Slf4j
public class ReviewRequestSeeder {

  private final ReviewRequestRepository reviewRequestRepository;
  private final ReviewResultRepository reviewResultRepository;
  private final DocumentRepository documentRepository;
  private final UserRepository userRepository;

  @Transactional
  @EventListener(DocumentSeededEvent.class)
  public void run() {
    log.info("🌱 Start seeding ReviewRequest & ReviewResult");

    // Only skip if we already have review results
    long existingResults = reviewResultRepository.count();
    long existingRequests = reviewRequestRepository.count();
    log.info("📊 Current data: {} review requests, {} review results", existingRequests, existingResults);
    
    if (existingResults > 0) {
      log.warn("⚠️ ReviewResult already has {} records → skip seeding. Delete review_result table data and restart to re-seed.", existingResults);
      return;
    }
    
    log.info("✅ No existing review results found. Proceeding with seeding...");

    // Get users
    User businessAdmin = userRepository.findByEmail("business1@capstone.com").orElse(null);
    List<User> reviewers = userRepository.findAll().stream()
        .filter(u -> u.getRole() == UserRole.REVIEWER)
        .toList();

    if (businessAdmin == null) {
      log.warn("⚠️ Business Admin not found. Skipping review request seed.");
      return;
    }

    if (reviewers.isEmpty()) {
      log.warn("⚠️ No reviewers found. Skipping review request seed.");
      return;
    }

    Instant now = Instant.now();
    int requestIndex = 0;
    int reviewerIndex = 0;

    // 1. PENDING_REVIEW documents → Create PENDING review requests
    List<Document> pendingReviewDocs = documentRepository.findAll().stream()
        .filter(d -> d.getStatus() == DocStatus.PENDING_REVIEW)
        .toList();
    
    log.info("Creating PENDING review requests for {} PENDING_REVIEW documents", pendingReviewDocs.size());
    for (Document doc : pendingReviewDocs) {
      User reviewer = reviewers.get(reviewerIndex % reviewers.size());
      reviewerIndex++;
      
      ReviewRequest request = ReviewRequest.builder()
          .id(SeedUtil.generateUUID("review-request-" + requestIndex))
          .document(doc)
          .reviewer(reviewer)
          .assignedBy(businessAdmin)
          .status(ReviewRequestStatus.PENDING)
          .responseDeadline(now.plus(1, ChronoUnit.DAYS))
          .note("Please review this premium document. Request #" + (requestIndex + 1))
          .build();

      reviewRequestRepository.save(request);
      log.info("✅ Created PENDING request: '{}' → Reviewer '{}'", doc.getTitle(), reviewer.getEmail());
      requestIndex++;
    }

    // 2. REVIEWING documents → Create ACCEPTED review requests (no ReviewResult yet)
    List<Document> reviewingDocs = documentRepository.findAll().stream()
        .filter(d -> d.getStatus() == DocStatus.REVIEWING)
        .toList();
    
    log.info("Creating ACCEPTED review requests for {} REVIEWING documents", reviewingDocs.size());
    for (Document doc : reviewingDocs) {
      User reviewer = reviewers.get(reviewerIndex % reviewers.size());
      reviewerIndex++;
      
      ReviewRequest request = ReviewRequest.builder()
          .id(SeedUtil.generateUUID("review-request-" + requestIndex))
          .document(doc)
          .reviewer(reviewer)
          .assignedBy(businessAdmin)
          .status(ReviewRequestStatus.ACCEPTED)
          .responseDeadline(now.minus(1, ChronoUnit.DAYS))
          .reviewDeadline(now.plus(2, ChronoUnit.DAYS))
          .respondedAt(now.minus(12, ChronoUnit.HOURS))
          .note("Reviewer is working on this document. Todo #" + (requestIndex + 1))
          .build();

      reviewRequestRepository.save(request);
      log.info("✅ Created ACCEPTED request (Todo): '{}' → Reviewer '{}'", doc.getTitle(), reviewer.getEmail());
      requestIndex++;
    }

    // 3. PENDING_APPROVE documents → Create ACCEPTED requests + PENDING ReviewResult
    List<Document> pendingApproveDocs = documentRepository.findAll().stream()
        .filter(d -> d.getStatus() == DocStatus.PENDING_APPROVE)
        .toList();
    
    log.info("Creating review results for {} PENDING_APPROVE documents", pendingApproveDocs.size());
    for (int i = 0; i < pendingApproveDocs.size(); i++) {
      Document doc = pendingApproveDocs.get(i);
      User reviewer = reviewers.get(reviewerIndex % reviewers.size());
      reviewerIndex++;
      
      ReviewRequest request = ReviewRequest.builder()
          .id(SeedUtil.generateUUID("review-request-" + requestIndex))
          .document(doc)
          .reviewer(reviewer)
          .assignedBy(businessAdmin)
          .status(ReviewRequestStatus.ACCEPTED)
          .responseDeadline(now.minus(3, ChronoUnit.DAYS))
          .reviewDeadline(now.minus(1, ChronoUnit.DAYS))
          .respondedAt(now.minus(2, ChronoUnit.DAYS))
          .note("Review submitted, waiting for BA approval.")
          .build();

      ReviewRequest savedRequest = reviewRequestRepository.save(request);
      
      // Create PENDING ReviewResult (waiting BA approval)
      ReviewDecision decision = (i % 2 == 0) ? ReviewDecision.APPROVED : ReviewDecision.REJECTED;
      ReviewResult review = ReviewResult.builder()
          .id(SeedUtil.generateUUID("review-result-pending-" + i))
          .reviewRequest(savedRequest)
          .document(doc)
          .reviewer(reviewer)
          .comment("Review completed. Decision: " + decision + ". Waiting for BA approval.")
          .reportFilePath("reviews/review-report-pending-" + i + ".docx")
          .decision(decision)
          .status(ReviewResultStatus.PENDING)
          .submittedAt(now.minus(6, ChronoUnit.HOURS))
          .build();

      reviewResultRepository.save(review);
      log.info("✅ Created PENDING review result: '{}' → Decision '{}' (waiting BA)", doc.getTitle(), decision);
      requestIndex++;
    }

    // 4. ACTIVE premium documents → Create completed review flow (distribute among reviewers)
    List<Document> allDocs = documentRepository.findAll();
    log.info("Total documents in DB: {}", allDocs.size());
    
    // Debug: count documents by status
    long pendingReviewCount = allDocs.stream().filter(d -> d.getStatus() == DocStatus.PENDING_REVIEW).count();
    long reviewingCount = allDocs.stream().filter(d -> d.getStatus() == DocStatus.REVIEWING).count();
    long pendingApproveCount = allDocs.stream().filter(d -> d.getStatus() == DocStatus.PENDING_APPROVE).count();
    long activeCount = allDocs.stream().filter(d -> d.getStatus() == DocStatus.ACTIVE).count();
    long rejectedCount = allDocs.stream().filter(d -> d.getStatus() == DocStatus.REJECTED).count();
    long activePremiumCount = allDocs.stream().filter(d -> d.getStatus() == DocStatus.ACTIVE && Boolean.TRUE.equals(d.getIsPremium())).count();
    
    log.info("Document status distribution: PENDING_REVIEW={}, REVIEWING={}, PENDING_APPROVE={}, ACTIVE={} (premium={}), REJECTED={}", 
        pendingReviewCount, reviewingCount, pendingApproveCount, activeCount, activePremiumCount, rejectedCount);
    
    List<Document> activeDocs = allDocs.stream()
        .filter(d -> d.getStatus() == DocStatus.ACTIVE && Boolean.TRUE.equals(d.getIsPremium()))
        .toList();
    
    log.info("Creating completed reviews for {} ACTIVE premium documents", activeDocs.size());
    for (int i = 0; i < activeDocs.size(); i++) {
      Document doc = activeDocs.get(i);
      // Distribute documents evenly among reviewers
      User reviewer = reviewers.get(i % reviewers.size());
      
      // Vary the submission time within last 7 days for trending calculation
      int daysAgo = (i % 7) + 1;
      int hoursOffset = (i % 12);
      Instant submittedAt = now.minus(daysAgo, ChronoUnit.DAYS).minus(hoursOffset, ChronoUnit.HOURS);
      
      ReviewRequest request = ReviewRequest.builder()
          .id(SeedUtil.generateUUID("review-request-active-" + i))
          .document(doc)
          .reviewer(reviewer)
          .assignedBy(businessAdmin)
          .status(ReviewRequestStatus.ACCEPTED)
          .responseDeadline(submittedAt.minus(3, ChronoUnit.DAYS))
          .reviewDeadline(submittedAt.minus(1, ChronoUnit.DAYS))
          .respondedAt(submittedAt.minus(2, ChronoUnit.DAYS))
          .note("Review completed and approved.")
          .build();

      ReviewRequest savedRequest = reviewRequestRepository.save(request);
      
      // Create APPROVED ReviewResult
      ReviewResult review = ReviewResult.builder()
          .id(SeedUtil.generateUUID("review-result-active-" + i))
          .reviewRequest(savedRequest)
          .document(doc)
          .reviewer(reviewer)
          .comment("This document has been thoroughly reviewed. The content is accurate and well-structured. Approved for publication.")
          .reportFilePath("reviews/review-report-active-" + i + ".docx")
          .decision(ReviewDecision.APPROVED)
          .status(ReviewResultStatus.APPROVED)
          .submittedAt(submittedAt)
          .approvedBy(businessAdmin)
          .approvedAt(submittedAt.plus(2, ChronoUnit.HOURS))
          .build();

      reviewResultRepository.save(review);
      log.info("✅ Created APPROVED review: '{}' → Reviewer '{}' (submitted {} days ago)", 
          doc.getTitle(), reviewer.getEmail(), daysAgo);
      requestIndex++;
    }

    // 5. REJECTED documents → Create completed review flow with rejection
    List<Document> rejectedDocs = documentRepository.findAll().stream()
        .filter(d -> d.getStatus() == DocStatus.REJECTED)
        .toList();
    
    log.info("Creating rejection reviews for {} REJECTED documents", rejectedDocs.size());
    for (int i = 0; i < rejectedDocs.size(); i++) {
      Document doc = rejectedDocs.get(i);
      User reviewer = reviewers.get(reviewerIndex % reviewers.size());
      reviewerIndex++;
      
      Instant submittedAt = now.minus(i + 2, ChronoUnit.DAYS);
      
      ReviewRequest request = ReviewRequest.builder()
          .id(SeedUtil.generateUUID("review-request-" + requestIndex))
          .document(doc)
          .reviewer(reviewer)
          .assignedBy(businessAdmin)
          .status(ReviewRequestStatus.ACCEPTED)
          .responseDeadline(submittedAt.minus(3, ChronoUnit.DAYS))
          .reviewDeadline(submittedAt.minus(1, ChronoUnit.DAYS))
          .respondedAt(submittedAt.minus(2, ChronoUnit.DAYS))
          .note("Review completed - document rejected.")
          .build();

      ReviewRequest savedRequest = reviewRequestRepository.save(request);
      
      // Create APPROVED ReviewResult with REJECTED decision
      ReviewResult review = ReviewResult.builder()
          .id(SeedUtil.generateUUID("review-result-rejected-" + i))
          .reviewRequest(savedRequest)
          .document(doc)
          .reviewer(reviewer)
          .comment("After careful review, this document does not meet our quality standards. The content has significant issues that need to be addressed.")
          .reportFilePath("reviews/review-report-rejected-" + i + ".docx")
          .decision(ReviewDecision.REJECTED)
          .status(ReviewResultStatus.APPROVED) // BA approved the rejection
          .submittedAt(submittedAt)
          .approvedBy(businessAdmin)
          .approvedAt(submittedAt.plus(3, ChronoUnit.HOURS))
          .build();

      reviewResultRepository.save(review);
      log.info("✅ Created REJECTED review: '{}' → REJECTED", doc.getTitle());
      requestIndex++;
    }

    // 6. Create some additional REJECTED review requests (reviewer declined invitation)
    List<Document> pendingReviewDocsForRejection = documentRepository.findAll().stream()
        .filter(d -> d.getStatus() == DocStatus.PENDING_REVIEW)
        .limit(3)
        .toList();
    
    String[] rejectionReasons = {
        "I don't have expertise in this domain.",
        "Currently overloaded with other review tasks.",
        "The document is outside my area of specialization."
    };
    
    for (int i = 0; i < pendingReviewDocsForRejection.size(); i++) {
      Document doc = pendingReviewDocsForRejection.get(i);
      // Use a different reviewer than the one assigned
      User reviewer = reviewers.get((reviewerIndex + 1) % reviewers.size());
      
      ReviewRequest request = ReviewRequest.builder()
          .id(SeedUtil.generateUUID("review-request-declined-" + i))
          .document(doc)
          .reviewer(reviewer)
          .assignedBy(businessAdmin)
          .status(ReviewRequestStatus.REJECTED)
          .responseDeadline(now.minus(1, ChronoUnit.DAYS))
          .respondedAt(now.minus(12, ChronoUnit.HOURS))
          .rejectionReason(rejectionReasons[i % rejectionReasons.length])
          .note("Reviewer declined this request.")
          .build();

      reviewRequestRepository.save(request);
      log.info("✅ Created REJECTED (declined) request: '{}' → Reviewer '{}'", doc.getTitle(), reviewer.getEmail());
    }

    log.info("✅ ReviewRequest & ReviewResult seeding completed! Total requests: {}", requestIndex);
  }
}
