package com.capstone.be.scheduler;

import com.capstone.be.domain.entity.ReviewRequest;
import com.capstone.be.domain.enums.ReviewRequestStatus;
import com.capstone.be.repository.ReviewRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Scheduled job to automatically expire review requests that have passed their deadlines
 * Runs daily at midnight (00:00:00)
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class ReviewRequestExpirationJob {

  private final ReviewRequestRepository reviewRequestRepository;

  private static final DateTimeFormatter FORMATTER = DateTimeFormatter
      .ofPattern("yyyy-MM-dd HH:mm:ss")
      .withZone(ZoneId.systemDefault());

  /**
   * Expire PENDING review requests that passed response deadline
   * Runs every day at 00:00:00 (midnight)
   * Cron format: second minute hour day month weekday
   */
  @Scheduled(cron = "0 0 0 * * *")
  @Transactional
  public void expirePendingReviewRequests() {
    Instant now = Instant.now();
    log.info("Starting scheduled job: Expire PENDING review requests at {}", FORMATTER.format(now));

    try {
      // Find all PENDING requests with response deadline passed
      List<ReviewRequest> expiredRequests = reviewRequestRepository.findExpiredPendingRequests(now);

      if (expiredRequests.isEmpty()) {
        log.info("No expired PENDING review requests found");
        return;
      }

      log.info("Found {} expired PENDING review requests to process", expiredRequests.size());

      int expiredCount = 0;
      for (ReviewRequest request : expiredRequests) {
        try {
          log.debug("Expiring PENDING review request {} - Document: {}, Reviewer: {}, Response Deadline: {}",
              request.getId(),
              request.getDocument().getId(),
              request.getReviewer().getId(),
              FORMATTER.format(request.getResponseDeadline()));

          request.setStatus(ReviewRequestStatus.EXPIRED);
          reviewRequestRepository.save(request);
          expiredCount++;

        } catch (Exception e) {
          log.error("Failed to expire PENDING review request {}: {}",
              request.getId(), e.getMessage(), e);
        }
      }

      log.info("Successfully expired {} PENDING review requests", expiredCount);

    } catch (Exception e) {
      log.error("Error during PENDING review request expiration job: {}", e.getMessage(), e);
    }
  }

  /**
   * Expire ACCEPTED review requests that passed review deadline
   * Runs every day at 00:00:00 (midnight)
   * Note: This marks ACCEPTED requests as EXPIRED if review deadline passed without submission
   * Also resets Document status to PENDING_REVIEW so BA can assign another reviewer
   */
  @Scheduled(cron = "0 0 0 * * *")
  @Transactional
  public void expireAcceptedReviewRequests() {
    Instant now = Instant.now();
    log.info("Starting scheduled job: Expire ACCEPTED review requests at {}", FORMATTER.format(now));

    try {
      // Find all ACCEPTED requests with review deadline passed
      List<ReviewRequest> expiredRequests = reviewRequestRepository.findExpiredAcceptedRequests(now);

      if (expiredRequests.isEmpty()) {
        log.info("No expired ACCEPTED review requests found");
        return;
      }

      log.info("Found {} expired ACCEPTED review requests to process", expiredRequests.size());

      int expiredCount = 0;
      for (ReviewRequest request : expiredRequests) {
        try {
          log.debug("Expiring ACCEPTED review request {} - Document: {}, Reviewer: {}, Review Deadline: {}",
              request.getId(),
              request.getDocument().getId(),
              request.getReviewer().getId(),
              FORMATTER.format(request.getReviewDeadline()));

          request.setStatus(ReviewRequestStatus.EXPIRED);
          reviewRequestRepository.save(request);

          // Reset Document status to PENDING_REVIEW so BA can assign another reviewer
          var document = request.getDocument();
          if (document.getStatus() == com.capstone.be.domain.enums.DocStatus.REVIEWING) {
            document.setStatus(com.capstone.be.domain.enums.DocStatus.PENDING_REVIEW);
            log.info("Document {} status reset to PENDING_REVIEW due to expired review request", document.getId());
          }

          expiredCount++;

        } catch (Exception e) {
          log.error("Failed to expire ACCEPTED review request {}: {}",
              request.getId(), e.getMessage(), e);
        }
      }

      log.info("Successfully expired {} ACCEPTED review requests", expiredCount);

    } catch (Exception e) {
      log.error("Error during ACCEPTED review request expiration job: {}", e.getMessage(), e);
    }
  }

  /**
   * Manual trigger method for testing purposes
   * Can be called from admin endpoint to manually run the expiration job
   */
  public void runManualExpiration() {
    log.info("Manual expiration job triggered");
    expirePendingReviewRequests();
    expireAcceptedReviewRequests();
  }
}
