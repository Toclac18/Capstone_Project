package com.capstone.be.dto.response.document;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * Response DTO for document statistics
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DocumentStatisticsResponse {
  
  // Total counts
  private Long totalDocuments;
  private Long totalActiveDocuments;
  private Long totalPremiumDocuments;
  private Long totalPublicDocuments;
  
  // Status breakdown
  private Map<String, Long> statusBreakdown;  // Key: DocStatus name, Value: count
  
  // Visibility breakdown
  private Map<String, Long> visibilityBreakdown;  // Key: DocVisibility name, Value: count
  
  // Engagement metrics
  private Long totalViews;
  private Long totalComments;
  private Long totalSaves;
  private Long totalVotes;
  private Long totalReports;
  private Long totalPurchases;  // Total premium document purchases
  
  // Review metrics (for premium documents)
  private Long totalReviewRequests;
  private Long pendingReviewRequests;
  private Long acceptedReviewRequests;
  private Long completedReviews;
  
  // Recent activity (last 30 days)
  private Long documentsUploadedLast30Days;
  private Long documentsActivatedLast30Days;
}

