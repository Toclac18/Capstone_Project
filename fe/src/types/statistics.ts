export interface PersonalDocumentStatistics {
  summary: SummaryStatistics;
  documentUploads: TimeSeriesData[];
  documentViews: TimeSeriesData[];
  votesReceived: TimeSeriesData[];
  commentsReceived: TimeSeriesData[];
  documentsSaved: TimeSeriesData[];
  statusBreakdown: StatusBreakdown[];
  premiumBreakdown: PremiumBreakdown;
}

export interface SummaryStatistics {
  totalDocumentsUploaded: number;
  totalViews: number;
  totalUpvotes: number;
  totalDownvotes: number;
  totalComments: number;
  totalSaves: number;
  totalPurchases: number;
  averageViewsPerDocument: number;
  averageVotesPerDocument: number;
}

export interface TimeSeriesData {
  date: string; // Format: YYYY-MM-DD
  count: number;
}

export interface StatusBreakdown {
  status: string;
  count: number;
}

export interface PremiumBreakdown {
  premiumCount: number;
  freeCount: number;
}

export interface StatisticsQueryParams {
  startDate?: string; // Format: YYYY-MM-DD
  endDate?: string; // Format: YYYY-MM-DD
}

// Organization Statistics Types
export interface OrganizationStatistics {
  organization: OrganizationInfo;
  summary: OrganizationSummaryStatistics;
  memberGrowth: TimeSeriesData[];
  documentUploads: TimeSeriesData[];
  documentViews: TimeSeriesData[];
  votesReceived: TimeSeriesData[];
  commentsReceived: TimeSeriesData[];
  documentsSaved: TimeSeriesData[];
  memberStatusBreakdown: StatusBreakdown[];
  documentStatusBreakdown: StatusBreakdown[];
  documentVisibilityBreakdown: VisibilityBreakdown[];
  premiumBreakdown: PremiumBreakdown;
  topContributors: TopContributor[];
}

export interface OrganizationInfo {
  id: string;
  name: string;
  type: string;
  email: string;
  createdAt: string;
}

export interface OrganizationSummaryStatistics {
  totalMembers: number;
  totalDocuments: number;
  totalViews: number;
  totalUpvotes: number;
  totalDownvotes: number;
  totalComments: number;
  totalSaves: number;
  totalPurchases: number;
  activeMembers: number;
  averageViewsPerDocument: number;
}

export interface VisibilityBreakdown {
  visibility: string;
  count: number;
}

export interface TopContributor {
  memberId: string;
  memberName: string;
  memberEmail: string;
  uploadCount: number;
}

