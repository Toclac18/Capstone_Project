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
  organizationId?: string; // For organization statistics
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

// Business Admin Statistics Types
export interface BusinessAdminDashboard {
  overview: DashboardOverview;
  quickStats: QuickStats;
}

export interface DashboardOverview {
  totalDocuments: number;
  totalUsers: number;
  totalOrganizations: number;
  totalReports: number;
  pendingReports: number;
  activeUsers: number;
  activeOrganizations: number;
}

export interface QuickStats {
  documentsToday: number;
  documentsThisWeek: number;
  documentsThisMonth: number;
  reportsToday: number;
  reportsThisWeek: number;
  reportsThisMonth: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
}

export interface GlobalDocumentStatistics {
  summary: GlobalDocumentSummaryStatistics;
  documentUploads: TimeSeriesData[];
  documentViews: TimeSeriesData[];
  votesReceived: TimeSeriesData[];
  commentsReceived: TimeSeriesData[];
  documentsSaved: TimeSeriesData[];
  documentsPurchased: TimeSeriesData[];
  statusBreakdown: StatusBreakdown[];
  visibilityBreakdown: VisibilityBreakdown[];
  premiumBreakdown: PremiumBreakdown;
  organizationBreakdown: OrganizationBreakdown[];
  typeBreakdown: TypeBreakdown[];
}

export interface GlobalDocumentSummaryStatistics {
  totalDocuments: number;
  totalViews: number;
  totalUpvotes: number;
  totalDownvotes: number;
  totalComments: number;
  totalSaves: number;
  totalPurchases: number;
  totalOrganizations: number;
  totalUploaders: number;
  averageViewsPerDocument: number;
  averageVotesPerDocument: number;
}

export interface OrganizationBreakdown {
  organizationId: string;
  organizationName: string;
  documentCount: number;
}

export interface TypeBreakdown {
  typeId: string;
  typeName: string;
  count: number;
}

export interface ReportHandlingStatistics {
  summary: ReportHandlingSummaryStatistics;
  reportsCreated: TimeSeriesData[];
  reportsResolved: TimeSeriesData[];
  reportsRejected: TimeSeriesData[];
  statusBreakdown: StatusBreakdown[];
  reasonBreakdown: ReasonBreakdown[];
  resolutionTimeBreakdown: ResolutionTimeBreakdown[];
}

export interface ReportHandlingSummaryStatistics {
  totalReports: number;
  pendingReports: number;
  inReviewReports: number;
  resolvedReports: number;
  rejectedReports: number;
  closedReports: number;
  averageResolutionTime: number; // in hours
  totalReportsThisMonth: number;
  totalReportsLastMonth: number;
}

export interface ReasonBreakdown {
  reason: string;
  count: number;
}

export interface ResolutionTimeBreakdown {
  timeRange: string;
  count: number;
}

// Load State Type
export type LoadState = "loading" | "success" | "error";

// Chuyển từ app/business-admin/dashboard/_components/UserStatisticsTab.tsx.
// services/statistics.service.ts cần kiểu này; service import từ một component
// trang là đảo tầng — luật ESLint boundaries chặn đúng chiều đó.

export interface RoleBreakdown {
  role: string;
  total: number;
  active: number;
  inactive: number;
  pendingVerification: number;
}

export interface UserStatistics {
  summary: {
    totalUsers: number;
    activeUsers: number;
    inactiveUsers: number;
    pendingVerificationUsers: number;
    totalReaders: number;
    totalReviewers: number;
    totalOrganizationAdmins: number;
    newUsersThisMonth: number;
    newUsersLastMonth: number;
    growthRate: number;
  };
  userGrowth: Array<{ date: string; count: number }>;
  activeUsersGrowth: Array<{ date: string; count: number }>;
  roleBreakdown: RoleBreakdown[];
  statusBreakdown: Array<{ status: string; count: number }>;
}
