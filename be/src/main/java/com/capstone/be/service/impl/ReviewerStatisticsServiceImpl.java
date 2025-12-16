package com.capstone.be.service.impl;

import com.capstone.be.domain.entity.ReviewResult;
import com.capstone.be.domain.entity.ReviewRequest;
import com.capstone.be.domain.enums.ReviewDecision;
import com.capstone.be.domain.enums.ReviewRequestStatus;
import com.capstone.be.dto.response.statistics.ReviewerStatisticsResponse;
import com.capstone.be.repository.ReviewResultRepository;
import com.capstone.be.repository.ReviewRequestRepository;
import com.capstone.be.service.ReviewerStatisticsService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewerStatisticsServiceImpl implements ReviewerStatisticsService {

  private final ReviewRequestRepository reviewRequestRepository;
  private final ReviewResultRepository reviewResultRepository;

  private static final DateTimeFormatter MONTH_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM");

  @Override
  @Transactional(readOnly = true)
  public ReviewerStatisticsResponse getReviewerStatistics(
      UUID reviewerId, Instant startDate, Instant endDate) {
    log.info("Getting reviewer statistics for reviewer {} from {} to {}", reviewerId, startDate, endDate);

    // Default to last 6 months if not provided
    if (startDate == null) {
      startDate = Instant.now().minusSeconds(180 * 24 * 60 * 60); // 6 months
    }
    if (endDate == null) {
      endDate = Instant.now();
    }

    // Make startDate and endDate final for lambda expressions
    final Instant finalStartDate = startDate;
    final Instant finalEndDate = endDate;

    // Get all review requests for this reviewer
    List<ReviewRequest> allReviewRequests = reviewRequestRepository.findByReviewer_Id(
        reviewerId, org.springframework.data.domain.Pageable.unpaged()).getContent();

    // Filter by date range (based on created date)
    List<ReviewRequest> filteredRequests = allReviewRequests.stream()
        .filter(req -> {
          Instant createdAt = req.getCreatedAt();
          return createdAt != null && !createdAt.isBefore(finalStartDate) && !createdAt.isAfter(finalEndDate);
        })
        .collect(Collectors.toList());

    // Get all document reviews for this reviewer
    List<ReviewResult> allReviews = reviewResultRepository.findByReviewer_Id(
        reviewerId, org.springframework.data.domain.Pageable.unpaged()).getContent();

    // Filter reviews by date range (based on submitted date)
    List<ReviewResult> filteredReviews = allReviews.stream()
        .filter(review -> {
          Instant submittedAt = review.getSubmittedAt();
          return submittedAt != null && !submittedAt.isBefore(finalStartDate) && !submittedAt.isAfter(finalEndDate);
        })
        .collect(Collectors.toList());

    // Calculate summary statistics
    ReviewerStatisticsResponse.Summary summary = ReviewerStatisticsResponse.Summary.builder()
        .totalReviewRequests((long) filteredRequests.size())
        .totalReviewsCompleted((long) filteredReviews.size())
        .totalReviewsApproved(filteredReviews.stream()
            .filter(r -> r.getDecision() == ReviewDecision.APPROVED)
            .count())
        .totalReviewsRejected(filteredReviews.stream()
            .filter(r -> r.getDecision() == ReviewDecision.REJECTED)
            .count())
        .pendingReviewRequests(filteredRequests.stream()
            .filter(r -> r.getStatus() == ReviewRequestStatus.PENDING)
            .count())
        .acceptedReviewRequests(filteredRequests.stream()
            .filter(r -> r.getStatus() == ReviewRequestStatus.ACCEPTED)
            .count())
        .rejectedReviewRequests(filteredRequests.stream()
            .filter(r -> r.getStatus() == ReviewRequestStatus.REJECTED)
            .count())
        .expiredReviewRequests(filteredRequests.stream()
            .filter(r -> r.getStatus() == ReviewRequestStatus.EXPIRED)
            .count())
        .build();

    // Calculate review request status breakdown
    Map<String, Long> reviewRequestStatusBreakdown = new HashMap<>();
    for (ReviewRequestStatus status : ReviewRequestStatus.values()) {
      long count = filteredRequests.stream()
          .filter(r -> r.getStatus() == status)
          .count();
      reviewRequestStatusBreakdown.put(status.name(), count);
    }

    // Calculate review decision breakdown
    Map<String, Long> reviewDecisionBreakdown = new HashMap<>();
    for (ReviewDecision decision : ReviewDecision.values()) {
      long count = filteredReviews.stream()
          .filter(r -> r.getDecision() == decision)
          .count();
      reviewDecisionBreakdown.put(decision.name(), count);
    }

    // Calculate reviews by month
    Map<String, Long> reviewsByMonth = filteredReviews.stream()
        .filter(r -> r.getSubmittedAt() != null)
        .collect(Collectors.groupingBy(
            review -> {
              LocalDate date = LocalDate.ofInstant(review.getSubmittedAt(), ZoneId.systemDefault());
              return date.format(MONTH_FORMATTER);
            },
            Collectors.counting()
        ));

    // Calculate average review time (from accepted to submitted)
    double averageReviewTimeDays = filteredReviews.stream()
        .filter(review -> {
          ReviewRequest request = review.getReviewRequest();
          return request != null && request.getRespondedAt() != null && review.getSubmittedAt() != null;
        })
        .mapToDouble(review -> {
          ReviewRequest request = review.getReviewRequest();
          Instant acceptedAt = request.getRespondedAt();
          Instant submittedAt = review.getSubmittedAt();
          long seconds = submittedAt.getEpochSecond() - acceptedAt.getEpochSecond();
          return seconds / (24.0 * 60 * 60); // Convert to days
        })
        .average()
        .orElse(0.0);

    return ReviewerStatisticsResponse.builder()
        .summary(summary)
        .reviewRequestStatusBreakdown(reviewRequestStatusBreakdown)
        .reviewDecisionBreakdown(reviewDecisionBreakdown)
        .reviewsByMonth(reviewsByMonth)
        .averageReviewTimeDays(averageReviewTimeDays)
        .build();
  }
}

