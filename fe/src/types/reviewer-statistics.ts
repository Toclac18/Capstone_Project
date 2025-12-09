export interface ReviewerStatistics {
  summary: ReviewerSummaryStatistics;
  reviewRequestStatusBreakdown: Record<string, number>;
  reviewDecisionBreakdown: Record<string, number>;
  reviewsByMonth: Record<string, number>;
  averageReviewTimeDays: number;
}

export interface ReviewerSummaryStatistics {
  totalReviewRequests: number;
  totalReviewsCompleted: number;
  totalReviewsApproved: number;
  totalReviewsRejected: number;
  pendingReviewRequests: number;
  acceptedReviewRequests: number;
  rejectedReviewRequests: number;
  expiredReviewRequests: number;
  completedReviewRequests: number;
}

export interface StatisticsQueryParams {
  startDate?: string; // Format: YYYY-MM-DD
  endDate?: string; // Format: YYYY-MM-DD
}


